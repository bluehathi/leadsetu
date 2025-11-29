<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkspaceControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_workspaces_index()
    {
        $response = $this->getJson('/api/workspaces');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_workspaces_index()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_workspaces');

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/workspaces');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_create_workspace()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('create_workspaces');

        $workspaceData = [
            'name' => 'New Workspace',
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/workspaces', $workspaceData);

        $response->assertStatus(201)
            ->assertJsonFragment($workspaceData);
    }

    public function test_authenticated_user_can_view_workspace()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_workspaces');
        $workspace = Workspace::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/workspaces/{$workspace->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => $workspace->name]);
    }

    public function test_authenticated_user_can_update_workspace()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('edit_workspaces');
        $workspace = Workspace::factory()->create();

        $updatedWorkspaceData = [
            'name' => 'Updated Workspace',
        ];

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/workspaces/{$workspace->id}", $updatedWorkspaceData);

        $response->assertStatus(200)
            ->assertJsonFragment($updatedWorkspaceData);
    }

    public function test_authenticated_user_can_delete_workspace()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('delete_workspaces');
        $workspace = Workspace::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/workspaces/{$workspace->id}");

        $response->assertStatus(204);
    }
}
