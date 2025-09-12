<?php

namespace Tests\Feature\Api;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_leads_index()
    {
        $response = $this->getJson('/api/leads');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_leads_index()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_leads');

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/leads');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_create_lead()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('create_leads');

        $leadData = [
            'title' => 'New Lead',
            'description' => 'This is a new lead.',
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/leads', $leadData);

        $response->assertStatus(201)
            ->assertJsonFragment($leadData);
    }

    public function test_authenticated_user_can_view_lead()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_leads');
        $lead = Lead::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/leads/{$lead->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['title' => $lead->title]);
    }

    public function test_authenticated_user_can_update_lead()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('edit_leads');
        $lead = Lead::factory()->create();

        $updatedLeadData = [
            'title' => 'Updated Lead',
        ];

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/leads/{$lead->id}", $updatedLeadData);

        $response->assertStatus(200)
            ->assertJsonFragment($updatedLeadData);
    }

    public function test_authenticated_user_can_delete_lead()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('delete_leads');
        $lead = Lead::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/leads/{$lead->id}");

        $response->assertStatus(204);
    }
}
