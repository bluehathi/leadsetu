<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::create([
            'name' => 'John Doe',
            'email' => 'maheshsain00@gmail.com',
            'password' => bcrypt('123456789'), // Use bcrypt for hashing the password    
            'email_verified_at' => now(), // Set email verification timestamp
            'remember_token' => null, // Set remember token to null
            'created_at' => now(), // Set created_at timestamp
            'updated_at' => now(), // Set updated_at timestamp        
        ]);
    }
}
