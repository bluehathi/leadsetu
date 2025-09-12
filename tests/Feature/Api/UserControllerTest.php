<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_users_index()
    {
        $response = $this->getJson('/api/users');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_users_index()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_users');

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/users');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_create_user()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('create_users');

        $userData = [
            'name' => 'New User',
            'email' => 'user@example.com',
            'password' => 'password',
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/users', $userData);

        $response->assertStatus(201)
            ->assertJsonFragment(['name' => 'New User']);
    }

    public function test_authenticated_user_can_view_user()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_users');
        $userToView = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/users/{$userToView->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => $userToView->name]);
    }

    public function test_authenticated_user_can_update_user()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('edit_users');
        $userToUpdate = User::factory()->create();

        $updatedUserData = [
            'name' => 'Updated User',
        ];

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/users/{$userToUpdate->id}", $updatedUserData);

        $response->assertStatus(200)
            ->assertJsonFragment($updatedUserData);
    }

    public function test_authenticated_user_can_delete_user()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('delete_users');
        $userToDelete = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/users/{$userToDelete->id}");

        $response->assertStatus(204);
    }
}
