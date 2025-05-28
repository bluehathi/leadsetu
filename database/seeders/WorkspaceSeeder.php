<?php

namespace Database\Seeders;

use App\Models\Workspace;
use Illuminate\Database\Seeder;

class WorkspaceSeeder extends Seeder
{
    public function run()
    {
        $workspaces = Workspace::factory()->count(1)->create();
        // Log activity for each workspace created
       
    }
}