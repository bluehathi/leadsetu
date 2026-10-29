<?php

namespace Tests\Feature\Api\V1;

use App\Models\EmailLog;
use App\Models\MailConfiguration;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithTenants;
use Tests\TestCase;

class WorkspaceSettingsApiTest extends TestCase
{
    use RefreshDatabase, InteractsWithTenants;

    private const SMTP = [
        'host' => '8.8.8.8', 'port' => 587, 'username' => 'smtp-user', 'password' => 'smtp-secret',
        'encryption' => 'tls', 'from_address' => 'hello@example.com', 'from_name' => 'Acme',
    ];

    // ---- workspace -------------------------------------------------------------------------

    public function test_workspace_requires_authentication_and_permission(): void
    {
        $this->getJson('/api/v1/workspace')->assertUnauthorized();
        $this->putJson('/api/v1/workspace', ['name' => 'x'])->assertUnauthorized();

        $this->actingAs($this->tenantUser([]), 'sanctum');
        $this->getJson('/api/v1/workspace')->assertForbidden();
        $this->putJson('/api/v1/workspace', ['name' => 'x'])->assertForbidden();
    }

    public function test_show_returns_only_the_callers_workspace(): void
    {
        $user = $this->tenantUser(['view_workspaces']);
        Workspace::factory()->create(['name' => 'Someone Else']);

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/workspace')
            ->assertOk()->assertJsonPath('data.id', $user->workspace_id);
    }

    public function test_update_changes_name_and_ignores_other_fields(): void
    {
        $user = $this->tenantUser(['edit_workspaces']);
        $other = Workspace::factory()->create(['name' => 'Untouched']);

        $this->actingAs($user, 'sanctum')->putJson('/api/v1/workspace', ['name' => 'Renamed', 'id' => $other->id])
            ->assertOk()->assertJsonPath('data.name', 'Renamed');

        $this->assertSame('Untouched', $other->fresh()->name);
        $this->assertSame('Renamed', $user->workspace->fresh()->name);
    }

    public function test_workspaces_cannot_be_listed_created_or_deleted_through_the_api(): void
    {
        $user = $this->tenantUser(['view_workspaces', 'create_workspaces', 'delete_workspaces']);
        $this->actingAs($user, 'sanctum');

        $this->getJson('/api/v1/workspaces')->assertNotFound();
        $this->postJson('/api/v1/workspaces', ['name' => 'x'])->assertNotFound();
        $this->deleteJson("/api/v1/workspaces/{$user->workspace_id}")->assertNotFound();
    }

    // ---- SMTP ------------------------------------------------------------------------------

    public function test_smtp_requires_authentication_and_permission(): void
    {
        $this->getJson('/api/v1/settings/smtp')->assertUnauthorized();
        $this->putJson('/api/v1/settings/smtp', self::SMTP)->assertUnauthorized();
        $this->postJson('/api/v1/settings/smtp/test')->assertUnauthorized();

        $this->actingAs($this->tenantUser(['view_users']), 'sanctum');
        $this->getJson('/api/v1/settings/smtp')->assertForbidden();
        $this->putJson('/api/v1/settings/smtp', self::SMTP)->assertForbidden();
        $this->postJson('/api/v1/settings/smtp/test')->assertForbidden();
    }

    public function test_smtp_can_be_saved_and_never_returns_secrets(): void
    {
        $user = $this->tenantUser(['manage_smtp_settings']);
        $this->actingAs($user, 'sanctum');

        $response = $this->putJson('/api/v1/settings/smtp', self::SMTP)->assertOk()
            ->assertJsonPath('data.host', '8.8.8.8')->assertJsonPath('data.has_password', true);

        $this->assertStringNotContainsString('smtp-secret', $response->getContent());
        $this->assertStringNotContainsString('smtp-secret', $this->getJson('/api/v1/settings/smtp')->getContent());

        $row = MailConfiguration::withoutGlobalScopes()->first();
        $this->assertSame($user->workspace_id, $row->workspace_id);
        $this->assertSame('smtp-secret', $row->password);
        $this->assertNotSame('smtp-secret', $row->getRawOriginal('password')); // encrypted at rest
    }

    public function test_blank_password_keeps_the_stored_one(): void
    {
        $this->actingAs($this->tenantUser(['manage_smtp_settings']), 'sanctum');
        $this->putJson('/api/v1/settings/smtp', self::SMTP)->assertOk();

        $this->putJson('/api/v1/settings/smtp', ['password' => ''] + self::SMTP + [])->assertOk();
        $this->putJson('/api/v1/settings/smtp', array_merge(self::SMTP, ['password' => null, 'from_name' => 'New']))->assertOk();

        $this->assertSame('smtp-secret', MailConfiguration::withoutGlobalScopes()->first()->password);
        $this->assertSame('New', MailConfiguration::withoutGlobalScopes()->first()->from_name);
        $this->assertSame(1, MailConfiguration::withoutGlobalScopes()->count());
    }

    public function test_password_is_required_the_first_time(): void
    {
        $this->actingAs($this->tenantUser(['manage_smtp_settings']), 'sanctum')
            ->putJson('/api/v1/settings/smtp', array_diff_key(self::SMTP, ['password' => 1]))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_internal_hosts_and_odd_ports_are_rejected(): void
    {
        $this->actingAs($this->tenantUser(['manage_smtp_settings']), 'sanctum');

        foreach (['127.0.0.1', '10.0.0.5', '169.254.169.254', '192.168.1.10', 'localhost'] as $host) {
            $this->putJson('/api/v1/settings/smtp', array_merge(self::SMTP, ['host' => $host]))
                ->assertUnprocessable()->assertJsonValidationErrors('host');
        }
        $this->putJson('/api/v1/settings/smtp', array_merge(self::SMTP, ['port' => 6379]))
            ->assertUnprocessable()->assertJsonValidationErrors('port');
    }

    public function test_smtp_settings_are_per_workspace(): void
    {
        $a = $this->tenantUser(['manage_smtp_settings']);
        $b = $this->tenantUser(['manage_smtp_settings']);

        $this->actingAs($a, 'sanctum')->putJson('/api/v1/settings/smtp', self::SMTP)->assertOk();

        $this->actingAs($b, 'sanctum')->getJson('/api/v1/settings/smtp')->assertOk()->assertJsonPath('data', null);
    }

    public function test_test_email_requires_saved_settings_and_reports_connection_errors(): void
    {
        $user = $this->tenantUser(['manage_smtp_settings']);
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/v1/settings/smtp/test')->assertUnprocessable();

        // Unreachable server -> a clean 422 instead of a 500.
        MailConfiguration::create(array_merge(self::SMTP, ['driver' => 'smtp', 'host' => '127.0.0.1', 'port' => 1]));
        $this->postJson('/api/v1/settings/smtp/test')->assertUnprocessable()->assertJsonStructure(['message']);
    }

    // ---- webhook tokens --------------------------------------------------------------------

    public function test_webhook_url_is_per_workspace_and_scopes_events(): void
    {
        $a = $this->tenantUser(['manage_smtp_settings']);
        $b = $this->tenantUser(['manage_smtp_settings']);

        $urlA = $this->actingAs($a, 'sanctum')->putJson('/api/v1/settings/smtp', self::SMTP)->json('data.webhook_url');
        $urlB = $this->actingAs($b, 'sanctum')->putJson('/api/v1/settings/smtp', self::SMTP)->json('data.webhook_url');
        $this->assertNotSame($urlA, $urlB);
        $this->assertStringNotContainsString('452855', $urlA);

        $log = EmailLog::create([
            'workspace_id' => $b->workspace_id, 'user_id' => $b->id, 'recipient_email' => 'x@example.com',
            'from_address' => 'f@example.com', 'from_name' => 'F', 'subject' => 's', 'status' => 'sent', 'esp_message_id' => 'msg-1',
        ]);
        $event = ['event' => 'delivered', 'message-id' => 'msg-1', 'date' => now()->toDateTimeString()];

        // Workspace A's token cannot touch workspace B's email.
        $this->postJson(parse_url($urlA, PHP_URL_PATH) . '?' . parse_url($urlA, PHP_URL_QUERY), $event)->assertOk();
        $this->assertSame('sent', $log->fresh()->status);

        $this->postJson(parse_url($urlB, PHP_URL_PATH) . '?' . parse_url($urlB, PHP_URL_QUERY), $event)->assertOk();
        $this->assertSame('delivered', $log->fresh()->status);
    }

    // ---- preferences -----------------------------------------------------------------------

    public function test_preferences_belong_to_the_caller_and_are_validated(): void
    {
        $user = $this->tenantUser([]);
        $this->actingAs($user, 'sanctum');

        $this->putJson('/api/v1/me/settings', ['settings' => ['leads_table_columns' => ['title', 'status']]])
            ->assertOk()->assertJsonPath('data.leads_table_columns.1', 'status');
        $this->putJson('/api/v1/me/settings', ['settings' => ['theme' => 'dark']])->assertOk();
        $this->getJson('/api/v1/me/settings')->assertOk()
            ->assertJsonPath('data.theme', 'dark')->assertJsonPath('data.leads_table_columns.0', 'title');

        $this->putJson('/api/v1/me/settings', ['settings' => ['Bad Key!' => 1]])->assertUnprocessable();
        $this->putJson('/api/v1/me/settings', ['settings' => ['blob' => str_repeat('x', 9000)]])->assertUnprocessable();

        $this->actingAs($this->tenantUser([]), 'sanctum')->getJson('/api/v1/me/settings')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_preferences_require_authentication(): void
    {
        $this->getJson('/api/v1/me/settings')->assertUnauthorized();
    }
}
