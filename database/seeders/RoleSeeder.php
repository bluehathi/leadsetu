<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Define roles and their permissions
        $roles = [
            'Admin' => Permission::pluck('name')->toArray(),
            'WorkSpace Owner' => Permission::where('name','not like','%roles%')
            ->where('name','not like','%permission%')
            ->pluck('name')->toArray(), // All permissions
            'Manager' => [
                'view_leads', 'create_leads', 'edit_leads', 'delete_leads',
                'view_users', 'view_workspaces',
                'view_roles', 'view_permissions',
                'view_activity_logs', 'view_dashboard',
            ],
            'Sales' => [
                'view_leads', 'create_leads', 'edit_leads',
                'view_workspaces',
                'view_dashboard',
            ],
            'Viewer' => [
                'view_leads', 'view_users', 'view_workspaces', 'view_roles', 'view_permissions', 'view_activity_logs', 'view_dashboard',
            ],
        ];

        foreach ($roles as $roleName => $perms) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($perms);
            // Log activity for each role created
           
        }
    }
}