<?php

namespace Tests\Feature\Api\V1;

use App\Models\Role;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\InteractsWithTenants;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    use RefreshDatabase, InteractsWithTenants;

    private const URL = '/api/v1/users';
    private const MANAGE = ['view_users', 'create_users', 'edit_users', 'delete_users'];

    private function role(string $name, array $permissions, ?int $workspaceId = null): Role
    {
        foreach ($permissions as $p) {
            \Spatie\Permission\Models\Permission::findOrCreate($p, 'web');
        }
        $role = Role::create(['name' => $name, 'guard_name' => 'web', 'workspace_id' => $workspaceId]);
        $role->givePermissionTo($permissions);

        return $role;
    }

    public function test_guests_are_rejected_on_every_endpoint(): void
    {
        $this->assertRequiresPermissions(self::URL, User::factory()->create()->id);
    }

    public function test_user_without_permissions_gets_403(): void
    {
        $actor = $this->tenantUser([]);
        $other = User::factory()->create(['workspace_id' => $actor->workspace_id]);

        $this->actingAs($actor, 'sanctum');
        $this->getJson(self::URL)->assertForbidden();
        $this->getJson(self::URL . "/{$other->id}")->assertForbidden();
        $this->postJson(self::URL, [])->assertForbidden();
        $this->putJson(self::URL . "/{$other->id}", ['name' => 'x'])->assertForbidden();
        $this->deleteJson(self::URL . "/{$other->id}")->assertForbidden();
    }

    public function test_index_lists_only_own_workspace_users_and_hides_secrets(): void
    {
        $actor = $this->tenantUser(['view_users']);
        $mate = User::factory()->create(['workspace_id' => $actor->workspace_id]);
        User::factory()->create(); // another workspace's user

        $response = $this->actingAs($actor, 'sanctum')->getJson(self::URL)->assertOk();

        $response->assertJsonCount(2, 'data');
        $this->assertEqualsCanonicalizing([$actor->id, $mate->id], collect($response->json('data'))->pluck('id')->all());
        $this->assertStringNotContainsString('password', $response->getContent());
    }

    public function test_other_workspace_users_are_invisible(): void
    {
        $foreign = User::factory()->create(['workspace_id' => Workspace::factory()->create()->id]);

        $this->assertTenantIsolated(self::URL, $foreign->id, self::MANAGE, ['name' => 'Hijacked']);
        $this->assertDatabaseHas('users', ['id' => $foreign->id, 'name' => $foreign->name]);
    }

    public function test_create_joins_creators_workspace_and_hashes_password(): void
    {
        $actor = $this->tenantUser(['create_users', 'view_contacts']);
        $role = $this->role('Viewer', ['view_contacts']);
        $other = Workspace::factory()->create();

        $id = $this->actingAs($actor, 'sanctum')->postJson(self::URL, [
            'name' => 'New Person', 'email' => 'new@example.com', 'password' => 'long-enough-1',
            'roles' => [$role->id], 'workspace_id' => $other->id,
        ])->assertCreated()->assertJsonPath('data.roles.0.name', 'Viewer')->json('data.id');

        $user = User::find($id);
        $this->assertSame($actor->workspace_id, $user->workspace_id);
        $this->assertTrue(Hash::check('long-enough-1', $user->password));
    }

    public function test_weak_passwords_and_duplicate_emails_are_rejected(): void
    {
        $actor = $this->tenantUser(['create_users']);

        $this->actingAs($actor, 'sanctum')->postJson(self::URL, [
            'name' => 'A', 'email' => $actor->email, 'password' => 'short',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_cannot_assign_a_role_with_permissions_the_actor_lacks(): void
    {
        $actor = $this->tenantUser(['create_users', 'view_contacts']);
        $admin = $this->role('Admin', ['view_contacts', 'delete_users', 'create_roles']);

        $this->actingAs($actor, 'sanctum')->postJson(self::URL, [
            'name' => 'Sneaky', 'email' => 's@example.com', 'password' => 'long-enough-1', 'roles' => [$admin->id],
        ])->assertUnprocessable()->assertJsonValidationErrors('roles.0');
        $this->assertDatabaseMissing('users', ['email' => 's@example.com']);
    }

    public function test_cannot_assign_another_workspaces_custom_role(): void
    {
        $actor = $this->tenantUser(['create_users', 'view_contacts']);
        $foreign = $this->role('Foreign', ['view_contacts'], Workspace::factory()->create()->id);

        $this->actingAs($actor, 'sanctum')->postJson(self::URL, [
            'name' => 'X', 'email' => 'x@example.com', 'password' => 'long-enough-1', 'roles' => [$foreign->id],
        ])->assertUnprocessable()->assertJsonValidationErrors('roles.0');
    }

    public function test_cannot_edit_or_delete_a_more_privileged_user(): void
    {
        $actor = $this->tenantUser(['edit_users', 'delete_users', 'view_users']);
        $boss = $this->tenantUser(['edit_users', 'delete_users', 'view_users', 'delete_roles'], $actor->workspace);

        $this->actingAs($actor, 'sanctum');
        $this->putJson(self::URL . "/{$boss->id}", ['password' => 'takeover-pass-1'])->assertForbidden();
        $this->deleteJson(self::URL . "/{$boss->id}")->assertForbidden();
        $this->assertFalse(Hash::check('takeover-pass-1', $boss->fresh()->password));
    }

    public function test_can_update_a_less_privileged_user(): void
    {
        $actor = $this->tenantUser(['edit_users', 'view_contacts', 'view_users']);
        $junior = $this->tenantUser(['view_contacts'], $actor->workspace);
        $role = $this->role('Viewer', ['view_contacts']);

        $this->actingAs($actor, 'sanctum')->putJson(self::URL . "/{$junior->id}", [
            'name' => 'Renamed', 'roles' => [$role->id], 'workspace_id' => 999,
        ])->assertOk()->assertJsonPath('data.name', 'Renamed');

        $this->assertSame($actor->workspace_id, $junior->fresh()->workspace_id);
    }

    public function test_cannot_delete_self_or_change_own_roles(): void
    {
        $actor = $this->tenantUser(['edit_users', 'delete_users', 'view_contacts']);
        $role = $this->role('Viewer', ['view_contacts']);

        $this->actingAs($actor, 'sanctum');
        $this->deleteJson(self::URL . "/{$actor->id}")->assertForbidden();
        $this->putJson(self::URL . "/{$actor->id}", ['roles' => [$role->id]])
            ->assertUnprocessable()->assertJsonValidationErrors('roles');
    }

    public function test_delete_removes_a_less_privileged_user(): void
    {
        $actor = $this->tenantUser(['delete_users', 'view_contacts']);
        $junior = $this->tenantUser([], $actor->workspace);

        $this->actingAs($actor, 'sanctum')->deleteJson(self::URL . "/{$junior->id}")->assertNoContent();
        $this->assertDatabaseMissing('users', ['id' => $junior->id]);
    }
}
