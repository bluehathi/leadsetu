<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Lead;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_filters_leads_by_status_and_qualification()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        Lead::factory()->create([
            'status' => 'won',
            'qualification' => 'Hot',
            'notes' => 'Test notes',
            'source' => 'website',
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
        ]);
        Lead::factory()->create([
            'status' => 'lost',
            'qualification' => 'Cold',
            'notes' => 'Test notes',
            'source' => 'website',
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
        ]);
        $response = $this->get('/leads?status=won&qualification=Hot');
        $response->assertSee('Hot')->assertDontSee('Cold');
    }
} 