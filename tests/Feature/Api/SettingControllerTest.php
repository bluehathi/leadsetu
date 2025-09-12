<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_settings()
    {
        $response = $this->getJson('/api/settings');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_settings()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('manage_settings');

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/settings');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_update_settings()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('manage_settings');

        $settings = [
            'setting1' => 'value1',
            'setting2' => 'value2',
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/settings', $settings);

        $response->assertStatus(200)
            ->assertJson($settings);
    }
}
