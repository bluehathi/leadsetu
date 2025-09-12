<?php

namespace Tests\Feature\Api;

use App\Models\EmailCampaign;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmailCampaignControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_email_campaigns_index()
    {
        $response = $this->getJson('/api/email-campaigns');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_email_campaigns_index()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_campaigns');

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/email-campaigns');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_create_email_campaign()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('create_campaign');

        $emailCampaignData = [
            'name' => 'New Email Campaign',
            'subject' => 'Test Subject',
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/email-campaigns', $emailCampaignData);

        $response->assertStatus(201)
            ->assertJsonFragment($emailCampaignData);
    }

    public function test_authenticated_user_can_view_email_campaign()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_campaigns');
        $emailCampaign = EmailCampaign::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/email-campaigns/{$emailCampaign->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => $emailCampaign->name]);
    }

    public function test_authenticated_user_can_update_email_campaign()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('edit_campaign');
        $emailCampaign = EmailCampaign::factory()->create();

        $updatedEmailCampaignData = [
            'name' => 'Updated Email Campaign',
        ];

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/email-campaigns/{$emailCampaign->id}", $updatedEmailCampaignData);

        $response->assertStatus(200)
            ->assertJsonFragment($updatedEmailCampaignData);
    }

    public function test_authenticated_user_can_delete_email_campaign()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('delete_campaign');
        $emailCampaign = EmailCampaign::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/email-campaigns/{$emailCampaign->id}");

        $response->assertStatus(204);
    }
}
