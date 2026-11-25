<?php

namespace Tests\Feature\Api\V1;

use App\Models\Role;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\Concerns\InteractsWithTenants;
use Tests\TestCase;

class RoleApiTest extends TestCase
{
    use RefreshDatabase, InteractsWithTenants;

    private const URL = '/api/v1/roles';
    private const MANAGE = ['view_roles', 'create_roles', 'edit_roles', 'delete_roles'];

    private function perm(string $name): Permission
    {
        return Permission::findOrCreate($name, 'web');
    }

    private function role(string $name, ?int $workspaceId = null): Role
    {
        return Role::create(['name' => $name, 'guard_name' => 'web', 'workspace_id' => $workspaceId]);
    }

    public function test_guests_are_rejected_on_every_endpoint(): void
    {
        $this->assertRequiresPermissions(self::URL, $this->role('X')->id);
    }

    public function test_user_without_permissions_gets_403(): void
    {
        $actor = $this->tenantUser([]);
        $role = $this->role('Mine', $actor->workspace_id);

        $this->actingAs($actor, 'sanctum');
        $this->getJson(self::URL)->assertForbidden();
        $this->postJson(self::URL, ['name' => 'x'])->assertForbidden();
        $this->putJson(self::URL . "/{$role->id}", ['name' => 'x'])->assertForbidden();
        $this->deleteJson(self::URL . "/{$role->id}")->assertForbidden();
    }

    public function test_index_shows_system_and_own_roles_but_not_other_workspaces(): void
    {
        $actor = $this->tenantUser(['view_roles']);
        $this->role('System Sales');
        $this->role('Mine', $actor->workspace_id);
        $this->role('Theirs', Workspace::factory()->create()->id);

        $names = collect($this->actingAs($actor, 'sanctum')->getJson(self::URL)->assertOk()->json('data'))->pluck('name');

        $this->assertEqualsCanonicalizing(['System Sales', 'Mine'], $names->all());
    }

    public function test_other_workspaces_custom_role_is_invisible(): void
    {
        $foreign = $this->role('Theirs', Workspace::factory()->create()->id);

        $this->assertTenantIsolated(self::URL, $foreign->id, self::MANAGE, ['name' => 'Hijacked']);
        $this->assertSame('Theirs', $foreign->fresh()->name);
    }

    public function test_create_custom_role_belongs_to_callers_workspace(): void
    {
        $actor = $this->tenantUser(['create_roles', 'view_contacts']);
        $perm = $this->perm('view_contacts');

        $id = $this->actingAs($actor, 'sanctum')->postJson(self::URL, [
            'name' => 'Support', 'permissions' => [$perm->id], 'workspace_id' => 999,
        ])->assertCreated()->assertJsonPath('data.is_system', false)->json('data.id');

        $this->assertSame($actor->workspace_id, Role::find($id)->workspace_id);
        $this->assertTrue(Role::find($id)->hasPermissionTo('view_contacts'));
    }

    public function test_cannot_grant_permissions_the_actor_lacks(): void
    {
        $actor = $this->tenantUser(['create_roles']);
        $powerful = $this->perm('delete_users');

        $this->actingAs($actor, 'sanctum')->postJson(self::URL, [
            'name' => 'Escalate', 'permissions' => [$powerful->id],
        ])->assertUnprocessable()->assertJsonValidationErrors('permissions.0');
        $this->assertDatabaseMissing('roles', ['name' => 'Escalate']);
    }

    public function test_cannot_widen_an_existing_role_beyond_own_permissions(): void
    {
        $actor = $this->tenantUser(['edit_roles']);
        $role = $this->role('Mine', $actor->workspace_id);
        $powerful = $this->perm('delete_users');

        $this->actingAs($actor, 'sanctum')->putJson(self::URL . "/{$role->id}", ['permissions' => [$powerful->id]])
            ->assertUnprocessable();
        $this->assertFalse($role->fresh()->hasPermissionTo('delete_users'));
    }

    public function test_system_roles_cannot_be_modified_or_deleted(): void
    {
        $actor = $this->tenantUser(self::MANAGE);
        $system = $this->role('Admin');

        $this->actingAs($actor, 'sanctum');
        $this->putJson(self::URL . "/{$system->id}", ['name' => 'Pwned'])->assertForbidden();
        $this->deleteJson(self::URL . "/{$system->id}")->assertForbidden();
        $this->assertSame('Admin', $system->fresh()->name);
    }

    public function test_role_names_are_unique_within_a_workspace_only(): void
    {
        $actor = $this->tenantUser(['create_roles']);
        $this->role('Support', $actor->workspace_id);
        $this->role('Billing', Workspace::factory()->create()->id);
        $this->role('Platform');

        $this->actingAs($actor, 'sanctum');
        $this->postJson(self::URL, ['name' => 'Support'])->assertUnprocessable();
        $this->postJson(self::URL, ['name' => 'Platform'])->assertUnprocessable();
        $this->postJson(self::URL, ['name' => 'Billing'])->assertCreated();
    }

    public function test_update_and_delete_own_custom_role(): void
    {
        $actor = $this->tenantUser(['edit_roles', 'delete_roles']);
        $role = $this->role('Mine', $actor->workspace_id);

        $this->actingAs($actor, 'sanctum');
        $this->putJson(self::URL . "/{$role->id}", ['name' => 'Renamed'])->assertOk()->assertJsonPath('data.name', 'Renamed');
        $this->deleteJson(self::URL . "/{$role->id}")->assertNoContent();
    }

    public function test_role_in_use_cannot_be_deleted(): void
    {
        $actor = $this->tenantUser(['delete_roles']);
        $role = $this->role('Mine', $actor->workspace_id);
        User::factory()->create(['workspace_id' => $actor->workspace_id])->assignRole($role);

        $this->actingAs($actor, 'sanctum')->deleteJson(self::URL . "/{$role->id}")
            ->assertUnprocessable()->assertJsonValidationErrors('role');
    }

    public function test_permissions_endpoint_is_read_only_and_flags_grantable(): void
    {
        $actor = $this->tenantUser(['view_permissions']);
        $this->perm('delete_users');

        $data = collect($this->actingAs($actor, 'sanctum')->getJson('/api/v1/permissions')->assertOk()->json('data'))->keyBy('name');

        $this->assertTrue($data['view_permissions']['grantable']);
        $this->assertFalse($data['delete_users']['grantable']);
        $this->postJson('/api/v1/permissions', ['name' => 'new_perm'])->assertStatus(405);
        $this->deleteJson('/api/v1/permissions/1')->assertNotFound();
    }

    public function test_permissions_endpoint_requires_permission(): void
    {
        $this->getJson('/api/v1/permissions')->assertUnauthorized();
        $this->actingAs($this->tenantUser([]), 'sanctum')->getJson('/api/v1/permissions')->assertForbidden();
    }
}
