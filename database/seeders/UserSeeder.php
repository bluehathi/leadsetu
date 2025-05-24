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
        $usersData = [
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'role' => 'Admin',
            ],
            [
                'name' => 'Manager User',
                'email' => 'manager@example.com',
                'role' => 'Manager',
            ],
            [
                'name' => 'Sales User',
                'email' => 'sales@example.com',
                'role' => 'Sales',
            ],
            [
                'name' => 'Viewer User',
                'email' => 'viewer@example.com',
                'role' => 'Viewer',
            ],
        ];

        $workspace = \App\Models\Workspace::first();
        foreach ($usersData as $userData) {
            $user = User::create([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'password' => bcrypt('123456789'),
                'email_verified_at' => now(),
                'remember_token' => null,
                'created_at' => now(),
                'updated_at' => now(),
                'workspace_id' => $workspace ? $workspace->id : null,
            ]);
            $user->syncRoles([$userData['role']]);
        }
    }
}
