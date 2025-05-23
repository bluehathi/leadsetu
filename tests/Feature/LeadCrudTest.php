<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Lead;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_update_and_delete_a_lead()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->post('/leads', [
            'name' => 'Lead1',
            'email' => 'lead1@example.com',
            'company' => 'Co1',
            'notes' => 'Test notes',
            'status' => 'new',
            'source' => 'website',
            'score' => 50,
            'qualification' => 'Warm',
            'user_id' => $user->id,
            'organization_id' => 1,
            'title' => 'Manager',
            'positions' => 'Sales',
            'tags' => ['demo'],
            'deal_value' => 1000,
            'expected_close' => now()->addMonth(),
            'lead_score' => 50,
            'lead_owner' => $user->id,
            'priority' => 'medium',
            'attachments' => [],
        ])->assertRedirect('/leads');

        $leadId = Lead::where('email', 'lead1@example.com')->first()->id;
        $this->put("/leads/$leadId", [
            'name' => 'Lead1 Updated',
            'email' => 'lead1@example.com',
            'company' => 'Co1',
            'notes' => 'Test notes',
            'status' => 'new',
            'source' => 'website',
            'score' => 50,
            'qualification' => 'Warm',
            'user_id' => $user->id,
            'organization_id' => 1,
            'title' => 'Manager',
            'positions' => 'Sales',
            'tags' => ['demo'],
            'deal_value' => 1000,
            'expected_close' => now()->addMonth(),
            'lead_score' => 50,
            'lead_owner' => $user->id,
            'priority' => 'medium',
            'attachments' => [],
        ])->assertRedirect('/leads');
        $this->delete("/leads/$leadId")->assertRedirect('/leads');
        $this->assertDatabaseMissing('leads', ['id' => $leadId]);
    }
} 