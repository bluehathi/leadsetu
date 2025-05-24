<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkspaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_and_update_workspace()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $workspace = Workspace::factory()->create(['name' => 'Workspace1']);
        $this->put("/workspaces/{$workspace->id}", ['name' => 'Workspace1 Updated'])
            ->assertRedirect();
        $this->assertDatabaseHas('workspaces', ['id' => $workspace->id, 'name' => 'Workspace1 Updated']);
    }
}