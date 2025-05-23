<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RolePermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_access_admin_route()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $response = $this->get('/admin');
        $response->assertForbidden();
    }
} 