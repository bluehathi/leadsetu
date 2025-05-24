<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Leads
            'view leads', 'create leads', 'edit leads', 'delete leads',
            // Users
            'view users', 'create users', 'edit users', 'delete users',
            // Workspaces
            'view workspaces', 'create workspaces', 'edit workspaces', 'delete workspaces',
            // Roles
            'view roles', 'create roles', 'edit roles', 'delete roles',
            // Permissions
            'view permissions', 'create permissions', 'edit permissions', 'delete permissions',
            // Activity Logs
            'view activity logs',
            // Dashboard
            'view dashboard','workspace_owner',
        ];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
    }
}