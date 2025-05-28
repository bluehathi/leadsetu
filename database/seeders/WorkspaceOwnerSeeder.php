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
            $workspaceOwner = WorkspaceOwner::firstOrCreate([
                'workspace_id' => $workspace->id,
                'user_id' => $owner->id,
            ]);
            // Log activity for each workspace owner assignment
            if (class_exists('App\\Models\\ActivityLog')) {
                \App\Models\ActivityLog::create([
                    'user_id' => $owner->id,
                    'workspace_id' => $workspace->id,
                    'action' => 'workspace_owner_assigned',
                    'subject_type' => WorkspaceOwner::class,
                    'subject_id' => $workspaceOwner->id,
                    'description' => 'Workspace owner assigned via seeder',
                    'properties' => json_encode([
                        'seeded' => true,
                        'workspace_id' => $workspace->id,
                        'user_id' => $owner->id,
                    ]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
