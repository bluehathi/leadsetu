<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Lead;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_shows_correct_dashboard_stats()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        Lead::factory()->count(3)->create(['status' => 'won', 'deal_value' => 1000]);
        $response = $this->get('/dashboard');
        $response->assertSee('3')->assertSee('1000');
    }
} 