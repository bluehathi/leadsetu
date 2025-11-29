<?php

namespace Tests\Feature\Api;

use App\Models\ProspectList;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProspectListControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_prospect_lists_index()
    {
        $response = $this->getJson('/api/prospect-lists');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_prospect_lists_index()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_prospect_lists');

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/prospect-lists');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_create_prospect_list()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('create_prospect_lists');

        $prospectListData = [
            'name' => 'New Prospect List',
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/prospect-lists', $prospectListData);

        $response->assertStatus(201)
            ->assertJsonFragment($prospectListData);
    }

    public function test_authenticated_user_can_view_prospect_list()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_prospect_lists');
        $prospectList = ProspectList::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/prospect-lists/{$prospectList->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => $prospectList->name]);
    }

    public function test_authenticated_user_can_update_prospect_list()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('edit_prospect_lists');
        $prospectList = ProspectList::factory()->create();

        $updatedProspectListData = [
            'name' => 'Updated Prospect List',
        ];

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/prospect-lists/{$prospectList->id}", $updatedProspectListData);

        $response->assertStatus(200)
            ->assertJsonFragment($updatedProspectListData);
    }

    public function test_authenticated_user_can_delete_prospect_list()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('delete_prospect_lists');
        $prospectList = ProspectList::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/prospect-lists/{$prospectList->id}");

        $response->assertStatus(204);
    }
}
