<?php

namespace Tests\Feature\Api\V1;

use App\Helpers\SmtpConfigHelper;
use App\Models\Company;
use App\Models\Contact;
use App\Models\EmailLog;
use App\Models\MailConfiguration;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\InteractsWithTenants;
use Tests\TestCase;

class ContactImportEmailApiTest extends TestCase
{
    use RefreshDatabase, InteractsWithTenants;

    private function csv(string $content, string $name = 'contacts.csv'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, $content);
    }

    private function contactIn(Workspace $ws, array $attrs = []): Contact
    {
        $company = Company::factory()->create(['workspace_id' => $ws->id]);

        return Contact::factory()->create($attrs + ['workspace_id' => $ws->id, 'company_id' => $company->id]);
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

    // ---- import ----------------------------------------------------------------------------

    public function test_import_requires_authentication_and_create_permission(): void
    {
        $this->postJson('/api/v1/contacts/import', ['file' => $this->csv("name\nA")])->assertUnauthorized();
        $this->actingAs($this->tenantUser(['view_contacts']), 'sanctum')
            ->postJson('/api/v1/contacts/import', ['file' => $this->csv("name\nA")])->assertForbidden();
    }

    public function test_import_creates_contacts_and_reuses_companies_in_the_callers_workspace(): void
    {
        $user = $this->tenantUser(['create_contacts']);
        $existing = Company::factory()->create(['workspace_id' => $user->workspace_id, 'name' => 'Acme Ltd']);
        Company::factory()->create(['workspace_id' => Workspace::factory()->create()->id, 'name' => 'Globex']); // other tenant's

        $csv = "Name,Email,Mobile,Title,Company,WebsiteUrl\n"
            . "Ann Lee,ann@example.com,555-1,CEO,Acme Ltd,https://acme.test\n"
            . "Bob Ray,bob@example.com,555-2,CTO,Globex,https://globex.test\n"
            . "Cy Poe,cy@example.com,,,Globex,\n";

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/contacts/import', ['file' => $this->csv($csv)])
            ->assertOk()->assertJsonPath('data.created', 3)->assertJsonPath('data.skipped', 0)->assertJsonCount(0, 'data.errors');

        $this->assertSame(3, Contact::count());
        $this->assertSame(2, Company::count()); // Acme reused, ONE new Globex for this tenant (not the other tenant's)
        $ann = Contact::where('email', 'ann@example.com')->first();
        $this->assertSame($existing->id, $ann->company_id);
        $this->assertSame('555-1', $ann->phone);
        $globex = Company::where('name', 'Globex')->first();
        $this->assertSame($user->workspace_id, $globex->workspace_id);
        $this->assertSame($globex->id, Contact::where('email', 'cy@example.com')->first()->company_id);
        $this->assertSame(0, Contact::withoutGlobalScopes()->where('workspace_id', '!=', $user->workspace_id)->count());
    }

    public function test_import_reports_bad_rows_skips_duplicates_and_is_repeatable(): void
    {
        $user = $this->tenantUser(['create_contacts']);
        $this->contactIn($user->workspace, ['email' => 'dup@example.com']);

        $csv = "name,email\nGood One,good@example.com\n,noname@example.com\nBad Email,not-an-email\nDupe,DUP@example.com\n\n";
        $this->actingAs($user, 'sanctum');

        $first = $this->postJson('/api/v1/contacts/import', ['file' => $this->csv($csv)])->assertOk();
        $first->assertJsonPath('data.created', 1)->assertJsonPath('data.skipped', 1)->assertJsonCount(2, 'data.errors');
        $this->assertSame([3, 4], array_column($first->json('data.errors'), 'row'));

        $second = $this->postJson('/api/v1/contacts/import', ['file' => $this->csv($csv)])->assertOk();
        $second->assertJsonPath('data.created', 0)->assertJsonPath('data.skipped', 2);
    }

    public function test_import_rejects_wrong_file_types_and_oversized_sheets(): void
    {
        $user = $this->tenantUser(['create_contacts']);
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/v1/contacts/import', [])->assertUnprocessable()->assertJsonValidationErrors('file');
        $this->postJson('/api/v1/contacts/import', ['file' => UploadedFile::fake()->create('evil.php', 1, 'application/x-php')])
            ->assertUnprocessable()->assertJsonValidationErrors('file');

        $big = "name\n" . implode("\n", array_map(fn ($i) => "Person $i", range(1, 2001)));
        $this->postJson('/api/v1/contacts/import', ['file' => $this->csv($big)])
            ->assertOk()->assertJsonPath('data.created', 0)->assertJsonPath('data.errors.0.row', 0);
        $this->assertSame(0, Contact::count());
    }

    public function test_contacts_without_a_company_get_one_named_after_themselves(): void
    {
        $user = $this->tenantUser(['create_contacts']);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/contacts/import', ['file' => $this->csv("name,email\nSolo Trader,solo@example.com\n")])
            ->assertOk()->assertJsonPath('data.created', 1);

        $this->assertSame('Solo Trader', Contact::first()->company->name);
    }

    // ---- one-to-one email ------------------------------------------------------------------

    protected function setUp(): void
    {
        parent::setUp();
        SmtpConfigHelper::$mailerOverride = fn () => Mail::mailer('array');
    }

    protected function tearDown(): void
    {
        SmtpConfigHelper::$mailerOverride = null;
        parent::tearDown();
    }

    public function test_sending_requires_authentication_and_the_send_permission(): void
    {
        $user = $this->tenantUser(['view_contacts', 'edit_contacts']);
        $contact = $this->contactIn($user->workspace);
        $payload = ['subject' => 'Hi', 'body' => '<p>Hello</p>'];

        $this->postJson("/api/v1/contacts/{$contact->id}/send-email", $payload)->assertUnauthorized();
        $this->actingAs($user, 'sanctum')->postJson("/api/v1/contacts/{$contact->id}/send-email", $payload)->assertForbidden();
    }

    public function test_cannot_email_another_workspaces_contact(): void
    {
        $user = $this->tenantUser(['send_campaign']);
        $this->smtpFor($user->workspace);
        $foreign = $this->contactIn(Workspace::factory()->create());

        $this->actingAs($user, 'sanctum')->postJson("/api/v1/contacts/{$foreign->id}/send-email", ['subject' => 'Hi', 'body' => '<p>x</p>'])->assertNotFound();
        $this->assertSame(0, EmailLog::count());
    }

    public function test_email_is_sanitized_sent_and_logged(): void
    {
        $user = $this->tenantUser(['send_campaign']);
        $this->smtpFor($user->workspace);
        $contact = $this->contactIn($user->workspace);

        $this->actingAs($user, 'sanctum')->postJson("/api/v1/contacts/{$contact->id}/send-email", [
            'subject' => 'Quote', 'body' => '<p onmouseover="x()">Hello</p><script>alert(1)</script>',
        ])->assertCreated()->assertJsonPath('data.status', 'sent')->assertJsonPath('data.recipient_email', $contact->email);

        $log = EmailLog::first();
        $this->assertSame($user->workspace_id, $log->workspace_id);
        $this->assertSame($contact->id, $log->contact_id);
        $this->assertStringNotContainsString('script', $log->body_html);
        $this->assertStringNotContainsString('onmouseover', $log->body_html);
    }

    public function test_unsubscribed_contacts_and_missing_smtp_are_refused(): void
    {
        $user = $this->tenantUser(['send_campaign']);
        $contact = $this->contactIn($user->workspace);
        $this->actingAs($user, 'sanctum');
        $payload = ['subject' => 'Hi', 'body' => '<p>x</p>'];

        $this->postJson("/api/v1/contacts/{$contact->id}/send-email", $payload)->assertUnprocessable()->assertJsonValidationErrors('contact'); // no SMTP

        $this->smtpFor($user->workspace);
        $contact->forceFill(['unsubscribed_at' => now()])->save();
        $this->postJson("/api/v1/contacts/{$contact->id}/send-email", $payload)->assertUnprocessable()->assertJsonValidationErrors('contact');
        $this->assertSame(0, EmailLog::count());
    }
}
