<?php

namespace Tests\Feature\Api\V1;

use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\Contact;
use App\Models\EmailLog;
use App\Models\Lead;
use App\Models\Workspace;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithTenants;
use Tests\TestCase;

class ActivityLogDashboardApiTest extends TestCase
{
    use RefreshDatabase, InteractsWithTenants;

    private function log(Workspace $ws, string $action, ?User $by = null, array $props = [], string $type = Lead::class): ActivityLog
    {
        $l = new ActivityLog(['action' => $action, 'description' => $action, 'subject_type' => $type, 'subject_id' => 1, 'properties' => $props]);
        $l->workspace_id = $ws->id;
        $l->user_id = $by?->id;
        $l->save();

        return $l;
    }

    // ---- activity logs ---------------------------------------------------------------------

    public function test_activity_logs_require_authentication_and_permission(): void
    {
        $this->getJson('/api/v1/activity-logs')->assertUnauthorized();
        $this->getJson('/api/v1/activity-logs/filters')->assertUnauthorized();

        $this->actingAs($this->tenantUser([]), 'sanctum');
        $this->getJson('/api/v1/activity-logs')->assertForbidden();
        $this->getJson('/api/v1/activity-logs/filters')->assertForbidden();
    }

    public function test_only_own_workspace_logs_are_listed(): void
    {
        $user = $this->tenantUser(['view_activity_logs']);
        $this->log($user->workspace, 'lead_created', $user);
        $this->log(Workspace::factory()->create(), 'lead_created');

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/activity-logs')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.user.name', $user->name)
            ->assertJsonPath('data.0.entity', 'Lead');
    }

    public function test_filters_by_user_action_entity_and_date(): void
    {
        $user = $this->tenantUser(['view_activity_logs']);
        $other = $this->tenantUser([], $user->workspace);
        $this->log($user->workspace, 'lead_created', $user);
        $this->log($user->workspace, 'contact_created', $other, [], Contact::class);
        $old = $this->log($user->workspace, 'lead_deleted', $user);
        $old->forceFill(['created_at' => now()->subMonths(2)])->save();
        $this->actingAs($user, 'sanctum');

        $this->getJson('/api/v1/activity-logs?action=contact_created')->assertJsonCount(1, 'data');
        $this->getJson("/api/v1/activity-logs?user_id={$other->id}")->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/activity-logs?entity=Contact')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/activity-logs?entity=Nothing')->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/activity-logs?from=' . now()->subDay()->toDateString())->assertJsonCount(2, 'data');
        $this->getJson('/api/v1/activity-logs?to=' . now()->subMonth()->toDateString())->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/activity-logs?from=not-a-date')->assertUnprocessable();
    }

    public function test_filter_options_only_contain_own_workspace_values(): void
    {
        $user = $this->tenantUser(['view_activity_logs']);
        $this->log($user->workspace, 'lead_created', $user);
        $this->log(Workspace::factory()->create(), 'secret_action');
        $this->tenantUser([]); // user in another workspace

        $data = $this->actingAs($user, 'sanctum')->getJson('/api/v1/activity-logs/filters')->assertOk()->json('data');

        $this->assertSame(['lead_created'], $data['actions']);
        $this->assertSame(['Lead'], $data['entities']);
        $this->assertCount(1, $data['users']);
    }

    public function test_secrets_are_redacted_on_write_and_on_read(): void
    {
        $user = $this->tenantUser(['view_activity_logs']);
        $this->log($user->workspace, 'user_created', $user, ['data' => ['email' => 'a@b.test', 'password' => 'hunter2', 'nested' => ['api_key' => 'k']]]);
        // A legacy row that was stored before redaction existed, as a JSON string.
        \DB::table('activity_logs')->insert([
            'workspace_id' => $user->workspace_id, 'action' => 'legacy', 'created_at' => now(), 'updated_at' => now(),
            'properties' => json_encode(json_encode(['password' => 'oldsecret', 'ok' => 1])),
        ]);

        $this->assertStringNotContainsString('hunter2', json_encode(ActivityLog::first()->properties));

        $body = $this->actingAs($user, 'sanctum')->getJson('/api/v1/activity-logs')->assertOk()->getContent();
        foreach (['hunter2', 'oldsecret', '"k"'] as $secret) {
            $this->assertStringNotContainsString($secret, $body);
        }
        $this->assertStringContainsString('a@b.test', $body);
    }

    public function test_activity_logs_are_read_only(): void
    {
        $user = $this->tenantUser(['view_activity_logs']);
        $log = $this->log($user->workspace, 'lead_created', $user);
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/v1/activity-logs', ['action' => 'x'])->assertStatus(405);
        $this->putJson("/api/v1/activity-logs/{$log->id}", [])->assertNotFound();
        $this->deleteJson("/api/v1/activity-logs/{$log->id}")->assertNotFound();
        $this->assertDatabaseHas('activity_logs', ['id' => $log->id]);
    }

    // ---- dashboard -------------------------------------------------------------------------

    public function test_dashboard_requires_authentication_and_permission(): void
    {
        $this->getJson('/api/v1/dashboard')->assertUnauthorized();
        $this->actingAs($this->tenantUser(['view_leads']), 'sanctum')->getJson('/api/v1/dashboard')->assertForbidden();
    }

    public function test_dashboard_sections_follow_the_users_permissions(): void
    {
        $user = $this->tenantUser(['view_dashboard', 'view_leads']);

        $data = $this->actingAs($user, 'sanctum')->getJson('/api/v1/dashboard')->assertOk()->json('data');

        $this->assertNotNull($data['leads']);
        foreach (['contacts', 'companies', 'campaigns', 'recent_activity'] as $hidden) {
            $this->assertNull($data[$hidden], "$hidden must be hidden without its permission");
        }
    }

    public function test_dashboard_numbers_only_count_the_own_workspace(): void
    {
        $user = $this->tenantUser(['view_dashboard', 'view_leads', 'view_contacts', 'view_companies', 'view_campaigns', 'view_activity_logs']);
        $ws = $user->workspace;
        $other = Workspace::factory()->create();

        Lead::factory()->create(['workspace_id' => $ws->id, 'user_id' => $user->id, 'status' => 'new', 'deal_value' => 100]);
        Lead::factory()->create(['workspace_id' => $ws->id, 'user_id' => $user->id, 'status' => 'qualified', 'deal_value' => 200]);
        Lead::factory()->create(['workspace_id' => $ws->id, 'user_id' => $user->id, 'status' => 'won', 'deal_value' => 500]);
        Lead::factory()->create(['workspace_id' => $ws->id, 'user_id' => $user->id, 'status' => 'lost', 'deal_value' => 900]);
        Lead::factory()->create(['workspace_id' => $other->id, 'user_id' => $user->id, 'status' => 'won', 'deal_value' => 99999]);

        $company = Company::factory()->create(['workspace_id' => $ws->id]);
        Contact::factory()->count(2)->create(['workspace_id' => $ws->id, 'company_id' => $company->id]);
        Contact::factory()->create(['workspace_id' => $other->id, 'company_id' => Company::factory()->create(['workspace_id' => $other->id])->id]);

        $data = $this->actingAs($user, 'sanctum')->getJson('/api/v1/dashboard')->assertOk()->json('data');

        $this->assertSame(4, $data['leads']['total']);
        $this->assertSame(25.0, (float) $data['leads']['conversion_rate']);
        $this->assertSame(300, $data['leads']['open_pipeline_value']);   // new + qualified only
        $this->assertSame(500, $data['leads']['won_value']);
        $this->assertSame(1, $data['leads']['by_status']['won']);
        $this->assertCount(6, $data['leads']['per_month']);
        $this->assertSame(4, collect($data['leads']['per_month'])->last()['created']);
        $this->assertSame(2, $data['contacts']['total']);
        $this->assertSame(1, $data['companies']['total']);
    }

    public function test_dashboard_campaign_stats_ignore_other_workspaces_emails(): void
    {
        $user = $this->tenantUser(['view_dashboard', 'view_campaigns']);
        $other = $this->tenantUser([]);
        $mk = fn ($u, $opened) => EmailLog::create([
            'workspace_id' => $u->workspace_id, 'user_id' => $u->id, 'recipient_email' => 'x@example.com', 'from_address' => 'f@example.com',
            'from_name' => 'F', 'subject' => 's', 'status' => 'sent', 'sent_at' => now(), 'opened_at' => $opened ? now() : null, 'campaign_id' => null,
        ]);
        // campaign_id is a FK; create real campaigns for each tenant
        foreach ([$user, $other] as $u) {
            $c = new \App\Models\EmailCampaign(['name' => 'c', 'subject' => 's', 'body' => 'b']);
            $c->workspace_id = $u->workspace_id; $c->user_id = $u->id; $c->status = 'sent'; $c->save();
            foreach ([true, false] as $opened) {
                $log = $mk($u, $opened); $log->forceFill(['campaign_id' => $c->id])->save();
            }
        }

        $data = $this->actingAs($user, 'sanctum')->getJson('/api/v1/dashboard')->assertOk()->json('data.campaigns');

        $this->assertSame(1, $data['total']);
        $this->assertSame(2, $data['emails_sent_30d']);
        $this->assertSame(50.0, (float) $data['open_rate_30d']);
    }
}
