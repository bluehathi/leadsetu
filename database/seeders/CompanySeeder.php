<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;
use App\Models\Workspace;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
        $workspace = Workspace::first();
      
            Company::factory()->count(3)->create([
                'workspace_id' => $workspace->id,
            ]);
        
    }
}
