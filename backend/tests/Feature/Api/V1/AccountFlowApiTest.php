<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Concerns\InteractsWithTenants;
use Tests\TestCase;

class AccountFlowApiTest extends TestCase
{
    use RefreshDatabase, InteractsWithTenants;

    private const API = '/api/v1';

    protected function setUp(): void
    {
        parent::setUp();
        config(['sanctum.stateful' => ['localhost']]); // SPA origin => session available on API routes
        $perm = Permission::findOrCreate('view_contacts', 'web');
        Role::findOrCreate('WorkSpace Owner', 'web')->givePermissionTo($perm);
    }

    private function spa(): static
    {
        return $this->withHeaders(['Origin' => 'http://localhost', 'Referer' => 'http://localhost/']);
    }

    private function registration(array $over = []): array
    {
        return $over + ['name' => 'Jane Doe', 'email' => 'jane@example.com', 'password' => 'Secret-pass-1', 'password_confirmation' => 'Secret-pass-1'];
    }

    // ---- registration ----------------------------------------------------------------------

    public function test_registration_creates_workspace_owner_logs_in_and_sends_verification(): void
    {
        Notification::fake();

        $response = $this->spa()->postJson(self::API . '/auth/register', $this->registration())
            ->assertCreated()
            ->assertJsonPath('data.email', 'jane@example.com')
            ->assertJsonPath('data.email_verified', false)
            ->assertJsonPath('data.roles.0', 'WorkSpace Owner')
            ->assertJsonPath('data.permissions.0', 'view_contacts');

        $user = User::where('email', 'jane@example.com')->first();
        $this->assertTrue(Hash::check('Secret-pass-1', $user->password));
        $this->assertSame("Jane Doe's Workspace", $user->workspace->name);
        $this->assertTrue($user->workspace->owners()->whereKey($user->id)->exists());
        Notification::assertSentTo($user, VerifyEmail::class);

        // The new session works straight away (fresh request: drop the in-memory user from registration).
        $this->app['auth']->forgetGuards();
        $this->getJson(self::API . '/me')->assertOk()->assertJsonPath('data.id', $response->json('data.id'));
    }

    public function test_registration_validates_input(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->spa()->postJson(self::API . '/auth/register', $this->registration(['email' => 'taken@example.com']))
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->spa()->postJson(self::API . '/auth/register', $this->registration(['password' => 'short1', 'password_confirmation' => 'short1']))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->spa()->postJson(self::API . '/auth/register', $this->registration(['password' => 'onlyletters', 'password_confirmation' => 'onlyletters']))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->spa()->postJson(self::API . '/auth/register', $this->registration(['password_confirmation' => 'different-1']))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertSame(1, User::count());
        $this->assertSame(0, Workspace::count());
    }

    public function test_registration_can_be_disabled(): void
    {
        config(['auth.registration_enabled' => false]);

        $this->spa()->postJson(self::API . '/auth/register', $this->registration())->assertForbidden();
        $this->assertSame(0, User::count());
    }

    public function test_registration_is_atomic_when_the_owner_role_is_missing(): void
    {
        Role::where('name', 'WorkSpace Owner')->delete();

        $this->withoutExceptionHandling()->spa();
        try {
            $this->postJson(self::API . '/auth/register', $this->registration());
            $this->fail('Expected the missing role to abort registration.');
        } catch (\Throwable) {
        }
        $this->assertSame(0, User::count());
        $this->assertSame(0, Workspace::count());
    }

    // ---- login throttling ------------------------------------------------------------------

    public function test_repeated_failed_logins_for_one_account_are_blocked(): void
    {
        $user = User::factory()->create();
        RateLimiter::clear(strtolower($user->email) . '|127.0.0.1');

        for ($i = 0; $i < 5; $i++) {
            $this->spa()->postJson(self::API . '/auth/login', ['email' => $user->email, 'password' => 'wrong'])->assertUnprocessable();
        }
        // Even the right password is refused while blocked.
        $this->spa()->postJson(self::API . '/auth/login', ['email' => $user->email, 'password' => 'password'])->assertStatus(429);
    }

    // ---- password reset --------------------------------------------------------------------

    public function test_forgot_password_answers_identically_and_only_mails_real_accounts(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $known = $this->postJson(self::API . '/auth/forgot-password', ['email' => $user->email])->assertOk();
        $unknown = $this->postJson(self::API . '/auth/forgot-password', ['email' => 'nobody@example.com'])->assertOk();

        $this->assertSame($known->json(), $unknown->json());
        Notification::assertSentTo($user, ResetPassword::class, function ($n) use ($user) {
            $url = parse_url($n->toMail($user)->actionUrl);
            return str_starts_with($n->toMail($user)->actionUrl, rtrim(config('app.frontend_url'), '/') . '/reset-password?token=') && ($url['path'] ?? '') === '/reset-password';
        });
        Notification::assertCount(1);
    }

    public function test_password_can_be_reset_once_with_a_valid_token(): void
    {
        $user = User::factory()->create();
        $token = Password::createToken($user);

        $payload = ['token' => $token, 'email' => $user->email, 'password' => 'Brand-new-pass-1', 'password_confirmation' => 'Brand-new-pass-1'];
        $this->postJson(self::API . '/auth/reset-password', $payload)->assertOk();
        $this->assertTrue(Hash::check('Brand-new-pass-1', $user->fresh()->password));

        // Token is single use.
        $this->postJson(self::API . '/auth/reset-password', $payload)->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_reset_rejects_bad_tokens_and_weak_passwords(): void
    {
        $user = User::factory()->create();
        $old = $user->password;

        $this->postJson(self::API . '/auth/reset-password', ['token' => 'bogus', 'email' => $user->email, 'password' => 'Brand-new-pass-1', 'password_confirmation' => 'Brand-new-pass-1'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->postJson(self::API . '/auth/reset-password', ['token' => Password::createToken($user), 'email' => $user->email, 'password' => 'weak', 'password_confirmation' => 'weak'])
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertSame($old, $user->fresh()->password);
    }

    // ---- email verification ----------------------------------------------------------------

    public function test_signed_verification_link_verifies_and_redirects_to_the_spa(): void
    {
        $user = User::factory()->unverified()->create();
        $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), ['id' => $user->id, 'hash' => sha1($user->email)]);

        $this->get($url)->assertRedirect(rtrim(config('app.frontend_url'), '/') . '/?verified=1');
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_verification_link_needs_valid_signature_and_matching_hash(): void
    {
        $user = User::factory()->unverified()->create();

        $this->get(self::API . "/auth/verify-email/{$user->id}/" . sha1($user->email))->assertForbidden(); // unsigned
        $badHash = URL::temporarySignedRoute('verification.verify', now()->addHour(), ['id' => $user->id, 'hash' => sha1('other@example.com')]);
        $this->get($badHash)->assertForbidden();
        $expired = URL::temporarySignedRoute('verification.verify', now()->subMinute(), ['id' => $user->id, 'hash' => sha1($user->email)]);
        $this->get($expired)->assertForbidden();
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_resend_verification(): void
    {
        Notification::fake();
        $unverified = User::factory()->unverified()->create();
        $verified = User::factory()->create();

        $this->postJson(self::API . '/auth/email/verification-notification')->assertUnauthorized();
        $this->actingAs($unverified, 'sanctum')->postJson(self::API . '/auth/email/verification-notification')->assertOk();
        Notification::assertSentTo($unverified, VerifyEmail::class);

        $this->actingAs($verified, 'sanctum')->postJson(self::API . '/auth/email/verification-notification')->assertOk();
        Notification::assertNotSentTo($verified, VerifyEmail::class);
    }

    public function test_unverified_users_are_blocked_from_business_endpoints_only_when_required(): void
    {
        $user = $this->tenantUser(['view_contacts']);
        $user->forceFill(['email_verified_at' => null])->save();
        $this->actingAs($user, 'sanctum');

        $this->getJson(self::API . '/contacts')->assertOk(); // default: not enforced

        config(['auth.require_verified_email' => true]);
        $this->getJson(self::API . '/contacts')->assertStatus(409)->assertJsonPath('code', 'email_not_verified');
        $this->getJson(self::API . '/me')->assertOk(); // account endpoints stay reachable so they can verify
        $this->postJson(self::API . '/auth/email/verification-notification')->assertOk();
    }

    // ---- profile ---------------------------------------------------------------------------

    public function test_profile_update_is_limited_to_the_caller_and_reverifies_a_new_email(): void
    {
        Notification::fake();
        $user = User::factory()->create(['workspace_id' => Workspace::factory()->create()->id]);
        $other = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $this->putJson(self::API . '/me', ['name' => 'New Name', 'workspace_id' => 99, 'password' => 'x'])
            ->assertOk()->assertJsonPath('data.name', 'New Name');
        $this->assertNotNull($user->fresh()->email_verified_at);

        $this->putJson(self::API . '/me', ['email' => $other->email])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->putJson(self::API . '/me', ['email' => 'changed@example.com'])->assertOk()->assertJsonPath('data.email_verified', false);
        Notification::assertSentTo($user->fresh(), VerifyEmail::class);
        $this->assertNotEquals(99, $user->fresh()->workspace_id);
    }

    public function test_password_change_requires_the_current_password_and_a_strong_new_one(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $this->putJson(self::API . '/me/password', ['current_password' => 'wrong', 'password' => 'Another-pass-1', 'password_confirmation' => 'Another-pass-1'])
            ->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->putJson(self::API . '/me/password', ['current_password' => 'password', 'password' => 'weak', 'password_confirmation' => 'weak'])
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->putJson(self::API . '/me/password', ['current_password' => 'password', 'password' => 'password', 'password_confirmation' => 'password'])
            ->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->putJson(self::API . '/me/password', ['current_password' => 'password', 'password' => 'Another-pass-1', 'password_confirmation' => 'Another-pass-1'])->assertOk();
        $this->assertTrue(Hash::check('Another-pass-1', $user->fresh()->password));
        $this->assertStringNotContainsString('Another-pass-1', json_encode(\App\Models\ActivityLog::withoutGlobalScopes()->get()));
    }

    public function test_account_endpoints_require_authentication(): void
    {
        $this->putJson(self::API . '/me', ['name' => 'x'])->assertUnauthorized();
        $this->putJson(self::API . '/me/password', [])->assertUnauthorized();
    }
}
