<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_allows_user_to_create_a_lead()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post('/leads', [
            'name' => 'Pest Lead',
            'email' => 'pestlead@example.com',
            'company' => 'Pest Co',
            'notes' => 'Test notes',
            'status' => 'new',
            'source' => 'website',
            'score' => 50,
            'qualification' => 'Warm',
            'user_id' => $user->id,
            'workspace_id' => 1,
            'title' => 'Manager',
            'positions' => 'Sales',
            'tags' => ['demo'],
            'deal_value' => 1000,
            'expected_close' => now()->addMonth(),
            'lead_score' => 50,
            'lead_owner' => $user->id,
            'priority' => 'medium',
            'attachments' => [],
        ]);

        $response->assertRedirect('/leads');
        $this->assertDatabaseHas('leads', [
            'name' => 'Pest Lead',
            'email' => 'pestlead@example.com',
        ]);
    }
}