<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoleControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_roles_index()
    {
        $response = $this->getJson('/api/roles');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_roles_index()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_roles');

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/roles');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_create_role()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('create_roles');

        $roleData = [
            'name' => 'New Role',
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/roles', $roleData);

        $response->assertStatus(201)
            ->assertJsonFragment($roleData);
    }

    public function test_authenticated_user_can_view_role()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_roles');
        $role = Role::create(['name' => 'Test Role']);

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/roles/{$role->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => $role->name]);
    }

    public function test_authenticated_user_can_update_role()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('edit_roles');
        $role = Role::create(['name' => 'Test Role']);

        $updatedRoleData = [
            'name' => 'Updated Role',
        ];

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/roles/{$role->id}", $updatedRoleData);

        $response->assertStatus(200)
            ->assertJsonFragment($updatedRoleData);
    }

    public function test_authenticated_user_can_delete_role()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('delete_roles');
        $role = Role::create(['name' => 'Test Role']);

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/roles/{$role->id}");

        $response->assertStatus(204);
    }
}
