<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrganizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_and_update_organization()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $org = Organization::factory()->create(['name' => 'Org1']);
        $this->put("/organizations/{$org->id}", ['name' => 'Org1 Updated'])
            ->assertRedirect();
        $this->assertDatabaseHas('organizations', ['id' => $org->id, 'name' => 'Org1 Updated']);
    }
} 