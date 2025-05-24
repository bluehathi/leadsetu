<?php

namespace Database\Seeders;

use App\Models\Workspace;
use Illuminate\Database\Seeder;

class WorkspaceSeeder extends Seeder
{
    public function run()
    {
        Workspace::factory()->count(5)->create();
    }
}