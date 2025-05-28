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
        $companies = Company::factory()->count(3)->create([
            'workspace_id' => $workspace->id,
        ]);
        // Log activity for each company created
        if (class_exists('App\\Models\\ActivityLog')) {
            foreach ($companies as $company) {
                \App\Models\ActivityLog::create([
                    'user_id' => 1,
                    'workspace_id' => $workspace->id,
                    'action' => 'company_created',
                    'subject_type' => Company::class,
                    'subject_id' => $company->id,
                    'description' => 'Company created via seeder',
                    'properties' => json_encode([
                        'seeded' => true,
                        'company_name' => $company->name,
                    ]),
                    'created_at' => $company->created_at,
                    'updated_at' => $company->updated_at,
                ]);
            }
        }
    }
}
