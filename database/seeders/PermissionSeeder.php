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
            'view_leads', 'create_leads', 'edit_leads', 'delete_leads',
            // Users
            'view_users', 'create_users', 'edit_users', 'delete_users',
            // Workspaces
            'view_workspaces', 'create_workspaces', 'edit_workspaces', 'delete_workspaces',
            // Roles
            'view_roles', 'create_roles', 'edit_roles', 'delete_roles',
            // Permissions
            'view_permissions', 'create_permissions', 'edit_permissions', 'delete_permissions',
            // Activity Logs
            'view_activity_logs',
            // Dashboard
            'view_dashboard','workspace_owner',
            //settings
            'manage_settings','manage_smtp_settings'
        ];
        foreach ($permissions as $permission) {
            $perm = Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
           
           
        }
    }
}