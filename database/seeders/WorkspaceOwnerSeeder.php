<?php

namespace Database\Seeders;

use App\Models\Workspace;
use App\Models\User;
use App\Models\WorkspaceOwner;
use Illuminate\Database\Seeder;

class WorkspaceOwnerSeeder extends Seeder
{
    public function run()
    {
        // Assign the first user as owner of each workspace
        $owner = User::find(1);
        $workspaces = Workspace::all();
        foreach ($workspaces as $workspace) {
            // Assign a random user as owner, or the first user if only one
            WorkspaceOwner::firstOrCreate([
                'workspace_id' => $workspace->id,
                'user_id' => $owner->id,
            ]);
        }
    }
}
