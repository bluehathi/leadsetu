<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Lead; // Import your Lead model
use Faker\Factory as Faker; // Import Faker library
use App\Models\ActivityLog;
use App\Models\Workspace;

class LeadSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         // Initialize Faker
         $faker = Faker::create();

         // Define the possible statuses and methods based on your frontend options
         $statuses = ['new', 'contacted', 'qualified', 'unqualified', 'lost', 'won'];
         $methods = ['website', 'referral', 'cold_call', 'advertisement', 'other'];
 
         // Number of leads to create
         $numberOfLeads = 50; // Adjust as needed
 
         // Get the first workspace
         $workspace = Workspace::first();
         $workspaceId = $workspace ? $workspace->id : null;
 
         // Loop to create multiple leads
         for ($i = 0; $i < $numberOfLeads; $i++) {
             $lead = Lead::create([
                 'name'      => $faker->name(), // Generate a fake name
                 'email'     => $faker->unique()->safeEmail(), // Generate a unique fake email
                 'phone'     => $faker->optional(0.8)->phoneNumber(), // 80% chance of having a phone number
                 'company'   => $faker->company(), 
                 'website'   => $faker->optional(0.6)->url(), // 60% chance of having a website URL
                 'status'    => $faker->randomElement($statuses), // Pick a random status
                 'source'    => $faker->randomElement($methods), // Pick a random method
                 'notes'     => $faker->paragraph(2), 
                 'title'     => $faker->jobTitle(), // New field
                 'positions' => $faker->words(2, true), // New field (comma separated string)
                 'tags'      => json_encode($faker->words(rand(1, 4))), // New field (array as JSON)
                 'deal_value' => $faker->numberBetween(1000, 99999),
                 'expected_close' => $faker->dateTimeBetween('now', '+3 months')->format('Y-m-d'),
                 'lead_score' => $faker->numberBetween(0, 100),
                 'lead_owner' => $faker->randomElement(['user1', 'user2']),
                 'priority' => $faker->randomElement(['Low', 'Medium', 'High']),
                 'attachments' => json_encode([]),
                 'user_id' => 1,
                 'created_at'=> $faker->dateTimeBetween('-1 year', 'now'), // Random creation date within the last year
                 'updated_at' => now(),
                 'workspace_id' => $workspaceId, // Use seeded workspace
             ]);
             $lead->calculateScoreAndQualification();
             ActivityLog::create([
                 'user_id' => 1,
                 'action' => 'lead_created',
                 'subject_type' => Lead::class,
                 'subject_id' => $lead->id,
                 'description' => 'Lead created via seeder',
                 'properties' => [
                     'seeded' => true,
                     'lead_name' => $lead->name,
                 ],
                 'created_at' => $lead->created_at,
                 'updated_at' => $lead->updated_at,
             ]);
         }
 
         // Optional: Output a message to the console
         $this->command->info("{$numberOfLeads} leads seeded successfully!");
        //
    }
}
