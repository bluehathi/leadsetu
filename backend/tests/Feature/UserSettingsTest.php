<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_save_and_retrieve_user_settings()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post('/user/settings', [
            'settings' => ['leads_table_columns' => ['name', 'email']],
        ]);
        $response->assertJson(['success' => true]);

        $get = $this->get('/user/settings');
        $get->assertJsonFragment(['leads_table_columns' => ['name', 'email']]);
    }
} 