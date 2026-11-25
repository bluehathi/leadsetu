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
            // Log activity for each contact created
            if (class_exists('App\\Models\\ActivityLog')) {
                \App\Models\ActivityLog::create([
                    'user_id' => 1,
                    'workspace_id' => $workspace->id,
                    'action' => 'contact_created',
                    'subject_type' => \App\Models\Contact::class,
                    'subject_id' => $contact->id,
                    'description' => 'Contact created via seeder',
                    'properties' => json_encode([
                        'seeded' => true,
                        'contact_name' => $contact->name,
                    ]),
                    'created_at' => $contact->created_at,
                    'updated_at' => $contact->updated_at,
                ]);
            }
        });
    }
}
