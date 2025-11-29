<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class PermissionControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_permissions_index()
    {
        $response = $this->getJson('/api/permissions');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_permissions_index()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_permissions');

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/permissions');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_create_permission()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('create_permissions');

        $permissionData = [
            'name' => 'new-permission',
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/permissions', $permissionData);

        $response->assertStatus(201)
            ->assertJsonFragment($permissionData);
    }

    public function test_authenticated_user_can_view_permission()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_permissions');
        $permission = Permission::create(['name' => 'test-permission']);

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/permissions/{$permission->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => $permission->name]);
    }

    public function test_authenticated_user_can_update_permission()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('edit_permissions');
        $permission = Permission::create(['name' => 'test-permission']);

        $updatedPermissionData = [
            'name' => 'updated-permission',
        ];

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/permissions/{$permission->id}", $updatedPermissionData);

        $response->assertStatus(200)
            ->assertJsonFragment($updatedPermissionData);
    }

    public function test_authenticated_user_can_delete_permission()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('delete_permissions');
        $permission = Permission::create(['name' => 'test-permission']);

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/permissions/{$permission->id}");

        $response->assertStatus(204);
    }
}
