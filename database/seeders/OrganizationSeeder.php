<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Organization;

class OrganizationSeeder extends Seeder
{
    public function run(): void
    {
        Organization::create([
            'name' => 'Demo Organization',
            'description' => 'A demo organization for seeding leads and users.'
        ]);
    }
} 