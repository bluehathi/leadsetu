<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Lead; // Import your Lead model
use Faker\Factory as Faker; // Import Faker library

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
 
         // Loop to create multiple leads
         for ($i = 0; $i < $numberOfLeads; $i++) {
             Lead::create([
                 'name'      => $faker->name(), // Generate a fake name
                 'email'     => $faker->unique()->safeEmail(), // Generate a unique fake email
                 'phone'     => $faker->optional(0.8)->phoneNumber(), // 80% chance of having a phone number
                 'company'   => $faker->company(), 
                 'website'   => $faker->optional(0.6)->url(), // 60% chance of having a website URL
                 'status'    => $faker->randomElement($statuses), // Pick a random status
                 'source'    => $faker->randomElement($methods), // Pick a random method
                 'notes'     => $faker->paragraph(2), 
                 'user_id' => 1,
                 'created_at'=> $faker->dateTimeBetween('-1 year', 'now'), // Random creation date within the last year
                 'updated_at'=> now()
             ]);
         }
 
         // Optional: Output a message to the console
         $this->command->info("{$numberOfLeads} leads seeded successfully!");
        //
    }
}
