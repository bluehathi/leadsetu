<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Contact;
use App\Models\Company;
use App\Models\Workspace;

class ContactSeeder extends Seeder
{
    public function run(): void
    {
        // Get all companies
        $companies = Company::all();
        $workspace = Workspace::first();

        // Create 20 contacts, each assigned to a random company
        Contact::factory()->count(20)->make()->each(function ($contact) use ($companies,$workspace) {
            $contact->company_id = $companies->random()->id;
             $contact->workspace_id = $workspace->id;
            
            $contact->save();
        });
    }
}
