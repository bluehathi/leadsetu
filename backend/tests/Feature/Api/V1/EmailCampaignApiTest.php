<?php

namespace Tests\Feature\Api\V1;

use App\Helpers\SmtpConfigHelper;
use App\Jobs\SendEmailCampaign;
use App\Models\Company;
use App\Models\Contact;
use App\Models\EmailCampaign;
use App\Models\EmailLog;
use App\Models\MailConfiguration;
use App\Models\ProspectList;
use App\Models\User;
use App\Models\Workspace;
use App\Support\WorkspaceContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\URL;
use Tests\Concerns\InteractsWithTenants;
use Tests\TestCase;

class EmailCampaignApiTest extends TestCase
{
    use RefreshDatabase, InteractsWithTenants;

    private const URL = '/api/v1/email-campaigns';
    private const ALL = ['view_campaigns', 'create_campaign', 'edit_campaign', 'delete_campaign', 'send_campaign'];

    protected function setUp(): void
    {
        parent::setUp();
        // Never open a real SMTP connection: route all sends to the in-memory "array" mailer.
        SmtpConfigHelper::$mailerOverride = fn () => Mail::mailer('array');
    }

    protected function tearDown(): void
    {
        SmtpConfigHelper::$mailerOverride = null;
        parent::tearDown();
    }

    private function smtpFor(Workspace $ws): void
    {
        $c = new MailConfiguration([
            'driver' => 'smtp', 'host' => 'smtp.example.com', 'port' => 587, 'username' => 'u', 'password' => 'p',
            'encryption' => 'tls', 'from_address' => 'from@example.com', 'from_name' => 'Acme',
        ]);
        $c->workspace_id = $ws->id;
        $c->save();
    }

    private function listWithContacts(Workspace $ws, int $subscribed = 2): ProspectList
    {
        $owner = User::factory()->create(['workspace_id' => $ws->id]);
        $list = new ProspectList(['name' => 'List ' . uniqid()]);
        $list->workspace_id = $ws->id;
        $list->user_id = $owner->id;
        $list->save();
        $company = Company::factory()->create(['workspace_id' => $ws->id]);
        for ($i = 0; $i < $subscribed; $i++) {
            $list->contacts()->attach(Contact::factory()->create(['workspace_id' => $ws->id, 'company_id' => $company->id])->id);
        }

        return $list;
    }

    private function campaignFor(User $user, ProspectList $list, array $attrs = []): EmailCampaign
    {
        $c = new EmailCampaign(['name' => 'Spring', 'subject' => 'Hello', 'body' => '<p>Hi there</p>']);
        $c->workspace_id = $user->workspace_id;
        $c->user_id = $user->id;
        $c->status = $attrs['status'] ?? 'draft';
        $c->scheduled_at = $attrs['scheduled_at'] ?? null;
        $c->save();
        $c->prospectLists()->sync([$list->id]);

        return $c;
    }

    public function test_guests_are_rejected_on_every_endpoint(): void
    {
        $user = $this->tenantUser([]);
        $campaign = $this->campaignFor($user, $this->listWithContacts($user->workspace));

        $this->assertRequiresPermissions(self::URL, $campaign->id);
        foreach (['send', 'schedule', 'cancel'] as $action) {
            $this->postJson(self::URL . "/{$campaign->id}/$action")->assertUnauthorized();
        }
        $this->getJson(self::URL . "/{$campaign->id}/deliveries")->assertUnauthorized();
    }

    public function test_user_without_permissions_gets_403(): void
    {
        $user = $this->tenantUser([]);
        $campaign = $this->campaignFor($user, $this->listWithContacts($user->workspace));

        $this->actingAs($user, 'sanctum');
        $this->getJson(self::URL)->assertForbidden();
        $this->getJson(self::URL . "/{$campaign->id}")->assertForbidden();
        $this->postJson(self::URL, [])->assertForbidden();
        $this->putJson(self::URL . "/{$campaign->id}", ['name' => 'x'])->assertForbidden();
        $this->deleteJson(self::URL . "/{$campaign->id}")->assertForbidden();
        $this->postJson(self::URL . "/{$campaign->id}/send")->assertForbidden();
        $this->postJson(self::URL . "/{$campaign->id}/schedule", ['scheduled_at' => now()->addDay()->toIso8601String()])->assertForbidden();
        $this->postJson(self::URL . "/{$campaign->id}/cancel")->assertForbidden();
    }

    public function test_editing_does_not_imply_permission_to_send(): void
    {
        Queue::fake();
        $user = $this->tenantUser(['view_campaigns', 'edit_campaign']);
        $this->smtpFor($user->workspace);
        $campaign = $this->campaignFor($user, $this->listWithContacts($user->workspace));

        $this->actingAs($user, 'sanctum')->postJson(self::URL . "/{$campaign->id}/send")->assertForbidden();
        Queue::assertNothingPushed();
    }

    public function test_other_workspace_campaigns_are_invisible_and_cannot_be_sent(): void
    {
        Queue::fake();
        $owner = $this->tenantUser([]);
        $foreign = $this->campaignFor($owner, $this->listWithContacts($owner->workspace));

        $this->assertTenantIsolated(self::URL, $foreign->id, self::ALL, ['name' => 'Hijacked']);

        $intruder = $this->tenantUser(self::ALL);
        $this->actingAs($intruder, 'sanctum');
        $this->postJson(self::URL . "/{$foreign->id}/send")->assertNotFound();
        $this->postJson(self::URL . "/{$foreign->id}/schedule", ['scheduled_at' => now()->addDay()->toIso8601String()])->assertNotFound();
        $this->getJson(self::URL . "/{$foreign->id}/deliveries")->assertNotFound();
        Queue::assertNothingPushed();
        $this->assertSame('draft', $foreign->fresh()->status);
    }

    public function test_index_lists_only_own_campaigns_without_bodies(): void
    {
        $user = $this->tenantUser(['view_campaigns']);
        $this->campaignFor($user, $this->listWithContacts($user->workspace));
        $other = $this->tenantUser([]);
        $this->campaignFor($other, $this->listWithContacts($other->workspace));

        $response = $this->actingAs($user, 'sanctum')->getJson(self::URL)->assertOk()->assertJsonCount(1, 'data');
        $this->assertArrayNotHasKey('body', $response->json('data.0'));
    }

    public function test_create_sanitizes_html_and_ignores_server_controlled_fields(): void
    {
        $user = $this->tenantUser(['create_campaign']);
        $list = $this->listWithContacts($user->workspace);

        $id = $this->actingAs($user, 'sanctum')->postJson(self::URL, [
            'name' => 'Launch', 'subject' => 'Big news', 'prospect_list_ids' => [$list->id],
            'body' => '<p onclick="steal()">Hi</p><script>alert(1)</script><iframe src="https://evil.test"></iframe><a href="javascript:alert(1)">x</a><b>bold</b>',
            'status' => 'sent', 'workspace_id' => 999, 'user_id' => 999,
        ])->assertCreated()->assertJsonPath('data.status', 'draft')->json('data.id');

        $campaign = EmailCampaign::find($id);
        $this->assertSame($user->workspace_id, $campaign->workspace_id);
        $this->assertSame($user->id, $campaign->user_id);
        foreach (['<script', 'onclick', 'iframe', 'javascript:'] as $bad) {
            $this->assertStringNotContainsString($bad, $campaign->body);
        }
        $this->assertStringContainsString('<b>bold</b>', $campaign->body);
    }

    public function test_cannot_target_another_workspaces_list(): void
    {
        $user = $this->tenantUser(['create_campaign']);
        $foreignList = $this->listWithContacts(Workspace::factory()->create());

        $this->actingAs($user, 'sanctum')->postJson(self::URL, [
            'name' => 'x', 'subject' => 'x', 'body' => '<p>x</p>', 'prospect_list_ids' => [$foreignList->id],
        ])->assertUnprocessable()->assertJsonValidationErrors('prospect_list_ids.0');
    }

    public function test_only_draft_or_scheduled_campaigns_can_be_edited_and_sending_ones_not_deleted(): void
    {
        $user = $this->tenantUser(['edit_campaign', 'delete_campaign']);
        $list = $this->listWithContacts($user->workspace);
        $sent = $this->campaignFor($user, $list, ['status' => 'sent']);
        $sending = $this->campaignFor($user, $list, ['status' => 'sending']);

        $this->actingAs($user, 'sanctum');
        $this->putJson(self::URL . "/{$sent->id}", ['name' => 'Changed'])->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->deleteJson(self::URL . "/{$sending->id}")->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->deleteJson(self::URL . "/{$sent->id}")->assertNoContent();
    }

    public function test_send_requires_smtp_and_recipients(): void
    {
        Queue::fake();
        $user = $this->tenantUser(['send_campaign']);
        $list = $this->listWithContacts($user->workspace);
        $campaign = $this->campaignFor($user, $list);
        $this->actingAs($user, 'sanctum');

        $this->postJson(self::URL . "/{$campaign->id}/send")->assertUnprocessable()->assertJsonValidationErrors('campaign');

        $this->smtpFor($user->workspace);
        $list->contacts()->update(['unsubscribed_at' => now()]);
        $this->postJson(self::URL . "/{$campaign->id}/send")->assertUnprocessable()->assertJsonValidationErrors('campaign');
        Queue::assertNothingPushed();
        $this->assertSame('draft', $campaign->fresh()->status);
    }

    public function test_send_delivers_to_subscribed_contacts_only_with_unsubscribe_links_and_never_twice(): void
    {
        $user = $this->tenantUser(['send_campaign']);
        $this->smtpFor($user->workspace);
        $list = $this->listWithContacts($user->workspace, 3);
        $contacts = $list->contacts()->get();
        $contacts[0]->forceFill(['unsubscribed_at' => now()])->save();   // suppressed
        $contacts[1]->forceFill(['email' => null])->save();               // no address
        $campaign = $this->campaignFor($user, $list);

        $this->actingAs($user, 'sanctum')->postJson(self::URL . "/{$campaign->id}/send")->assertOk();

        $campaign->refresh();
        $this->assertSame('sent', $campaign->status);
        $this->assertNotNull($campaign->sent_at);
        $logs = EmailLog::where('campaign_id', $campaign->id)->get();
        $this->assertCount(1, $logs);
        $this->assertSame($contacts[2]->id, $logs[0]->contact_id);
        $this->assertSame('sent', $logs[0]->status);
        $this->assertSame($user->workspace_id, $logs[0]->workspace_id);
        $this->assertStringContainsString('/unsubscribe/' . $contacts[2]->id . '?', $logs[0]->body_html);

        // A stale/duplicate job must do nothing.
        (new SendEmailCampaign($campaign->id, $campaign->workspace_id))->handle(app(\App\Services\CampaignSender::class));
        $this->assertCount(1, EmailLog::where('campaign_id', $campaign->id)->get());
        $this->postJson(self::URL . "/{$campaign->id}/send")->assertUnprocessable(); // not editable any more
    }

    public function test_show_includes_stats_and_deliveries_are_listed(): void
    {
        $user = $this->tenantUser(['view_campaigns', 'send_campaign']);
        $this->smtpFor($user->workspace);
        $campaign = $this->campaignFor($user, $this->listWithContacts($user->workspace, 2));
        $this->actingAs($user, 'sanctum')->postJson(self::URL . "/{$campaign->id}/send")->assertOk();

        $this->getJson(self::URL . "/{$campaign->id}")->assertOk()
            ->assertJsonPath('data.stats.recipients', 2)->assertJsonPath('data.stats.sent', 2)
            ->assertJsonPath('data.status', 'sent');
        $this->getJson(self::URL . "/{$campaign->id}/deliveries")->assertOk()->assertJsonCount(2, 'data');
        $this->getJson(self::URL . "/{$campaign->id}/deliveries?status=failed")->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_schedule_validates_time_and_queues_a_delayed_job_that_only_fires_if_unchanged(): void
    {
        Queue::fake();
        $user = $this->tenantUser(['send_campaign']);
        $this->smtpFor($user->workspace);
        $campaign = $this->campaignFor($user, $this->listWithContacts($user->workspace));
        $this->actingAs($user, 'sanctum');

        $this->postJson(self::URL . "/{$campaign->id}/schedule", ['scheduled_at' => now()->subHour()->toIso8601String()])
            ->assertUnprocessable()->assertJsonValidationErrors('scheduled_at');
        $this->postJson(self::URL . "/{$campaign->id}/schedule", [])->assertUnprocessable();

        $at = now()->addDays(2)->startOfSecond();
        $this->postJson(self::URL . "/{$campaign->id}/schedule", ['scheduled_at' => $at->toIso8601String()])
            ->assertOk()->assertJsonPath('data.status', 'scheduled');
        Queue::assertPushed(SendEmailCampaign::class, fn ($job) => $job->campaignId === $campaign->id && $job->scheduledFor === $at->timestamp);

        // Cancelling turns the queued job into a no-op.
        $this->postJson(self::URL . "/{$campaign->id}/cancel")->assertOk()->assertJsonPath('data.status', 'draft');
        (new SendEmailCampaign($campaign->id, $campaign->workspace_id, $at->timestamp))->handle(app(\App\Services\CampaignSender::class));
        $this->assertSame('draft', $campaign->fresh()->status);
        $this->assertSame(0, EmailLog::where('campaign_id', $campaign->id)->count());
    }

    public function test_scheduled_job_sends_when_it_fires_on_time_but_not_if_rescheduled(): void
    {
        Queue::fake();
        $user = $this->tenantUser(['send_campaign']);
        $this->smtpFor($user->workspace);
        $campaign = $this->campaignFor($user, $this->listWithContacts($user->workspace, 1));
        $this->actingAs($user, 'sanctum');

        $first = now()->addDay()->startOfSecond();
        $second = now()->addDays(3)->startOfSecond();
        $this->postJson(self::URL . "/{$campaign->id}/schedule", ['scheduled_at' => $first->toIso8601String()])->assertOk();
        $this->postJson(self::URL . "/{$campaign->id}/schedule", ['scheduled_at' => $second->toIso8601String()])->assertOk();
        $sender = app(\App\Services\CampaignSender::class);

        (new SendEmailCampaign($campaign->id, $campaign->workspace_id, $first->timestamp))->handle($sender); // stale
        $this->assertSame('scheduled', $campaign->fresh()->status);

        (new SendEmailCampaign($campaign->id, $campaign->workspace_id, $second->timestamp))->handle($sender);
        $this->assertSame('sent', $campaign->fresh()->status);
        $this->assertSame(1, EmailLog::where('campaign_id', $campaign->id)->count());
    }

    public function test_job_never_touches_another_workspaces_campaign(): void
    {
        $owner = $this->tenantUser([]);
        $this->smtpFor($owner->workspace);
        $campaign = $this->campaignFor($owner, $this->listWithContacts($owner->workspace), ['status' => 'queued']);
        $otherWorkspace = Workspace::factory()->create();

        (new SendEmailCampaign($campaign->id, $otherWorkspace->id))->handle(app(\App\Services\CampaignSender::class));

        $this->assertSame('queued', WorkspaceContext::run($owner->workspace_id, fn () => EmailCampaign::find($campaign->id)->status));
        $this->assertSame(0, EmailLog::count());
    }

    public function test_unsubscribe_link_requires_a_valid_signature(): void
    {
        $ws = Workspace::factory()->create();
        $contact = Contact::factory()->create(['workspace_id' => $ws->id, 'company_id' => Company::factory()->create(['workspace_id' => $ws->id])->id]);

        $this->get("/unsubscribe/{$contact->id}")->assertForbidden();
        $this->assertNull($contact->fresh()->unsubscribed_at);

        $this->get(URL::signedRoute('contacts.unsubscribe', ['contact' => $contact->id]))->assertOk()->assertSee('unsubscribed');
        $this->assertNotNull($contact->fresh()->unsubscribed_at);
    }

    public function test_webhook_unsubscribe_and_hard_bounce_suppress_the_contact(): void
    {
        $user = $this->tenantUser(['manage_smtp_settings']);
        $this->smtpFor($user->workspace);
        $config = MailConfiguration::withoutGlobalScopes()->first();
        $config->ensureWebhookToken();
        $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);
        $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id, 'company_id' => $company->id]);
        EmailLog::create([
            'workspace_id' => $user->workspace_id, 'user_id' => $user->id, 'contact_id' => $contact->id,
            'recipient_email' => $contact->email, 'from_address' => 'f@example.com', 'from_name' => 'F', 'subject' => 's',
            'status' => 'sent', 'esp_message_id' => 'wh-1',
        ]);

        $this->postJson('/api/webhooks/brevo?token=' . $config->webhook_token, ['event' => 'hard_bounce', 'message-id' => 'wh-1', 'date' => now()->toDateTimeString()])->assertOk();

        $this->assertNotNull($contact->fresh()->unsubscribed_at);
    }
}
