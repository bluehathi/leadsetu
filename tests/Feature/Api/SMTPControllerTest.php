<?php

namespace Tests\Feature\Api;

use App\Models\MailConfiguration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SMTPControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_smtp_settings_index()
    {
        $response = $this->getJson('/api/smtp-settings');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_smtp_settings_index()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('manage_smtp_settings');

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/smtp-settings');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_create_smtp_setting()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('manage_smtp_settings');

        $smtpData = [
            'mailer' => 'smtp',
            'host' => 'smtp.mailtrap.io',
            'port' => 2525,
            'username' => 'testuser',
            'password' => 'testpass',
            'encryption' => 'tls',
            'from_address' => 'from@example.com',
            'from_name' => 'Test From',
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/smtp-settings', $smtpData);

        $response->assertStatus(201)
            ->assertJsonFragment($smtpData);
    }

    public function test_authenticated_user_can_view_smtp_setting()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('manage_smtp_settings');
        $smtp = MailConfiguration::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/smtp-settings/{$smtp->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['host' => $smtp->host]);
    }

    public function test_authenticated_user_can_update_smtp_setting()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('manage_smtp_settings');
        $smtp = MailConfiguration::factory()->create();

        $updatedSmtpData = [
            'host' => 'new.smtp.host',
        ];

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/smtp-settings/{$smtp->id}", $updatedSmtpData);

        $response->assertStatus(200)
            ->assertJsonFragment($updatedSmtpData);
    }

    public function test_authenticated_user_can_delete_smtp_setting()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('manage_smtp_settings');
        $smtp = MailConfiguration::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/smtp-settings/{$smtp->id}");

        $response->assertStatus(204);
    }
}
