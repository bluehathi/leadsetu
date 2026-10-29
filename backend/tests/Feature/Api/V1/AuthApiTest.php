<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithTenants;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase, InteractsWithTenants;

    // A stateful (SPA) origin, so Sanctum starts a session for the request.
    private function spa(): static
    {
        config(['sanctum.stateful' => ['localhost']]);

        return $this->withHeaders(['Origin' => 'http://localhost', 'Referer' => 'http://localhost/']);
    }

    public function test_login_returns_user_and_permissions(): void
    {
        $user = $this->tenantUser(['view_contacts']);

        $this->spa()->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.permissions.0', 'view_contacts');
    }

    public function test_invalid_credentials_return_422(): void
    {
        $user = User::factory()->create();

        $this->spa()->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'wrong'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_me_returns_workspace_and_permissions(): void
    {
        $user = $this->tenantUser(['view_contacts']);

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.workspace.id', $user->workspace_id)
            ->assertJsonPath('data.permissions.0', 'view_contacts');
    }

    public function test_brevo_webhook_rejects_requests_without_the_secret(): void
    {
        config(['services.brevo.webhook_secret' => null]);
        $this->postJson('/api/webhooks/brevo?token=', [])->assertForbidden();

        config(['services.brevo.webhook_secret' => 's3cret']);
        $this->postJson('/api/webhooks/brevo?token=wrong', [])->assertForbidden();
        $this->postJson('/api/webhooks/brevo?token=s3cret', [])->assertOk();
    }
}
