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
                'view_items', 'create_items', 'edit_items', 'view_tax_rates',
                'view_quotes', 'create_quotes', 'edit_quotes',
                'view_invoices', 'create_invoices', 'edit_invoices', 'issue_invoices', 'record_payments',
            ],
            'Sales' => [
                'view_leads', 'create_leads', 'edit_leads',
                'view_workspaces',
                'view_dashboard',
                'view_items', 'view_tax_rates', 'view_quotes', 'create_quotes', 'edit_quotes', 'view_invoices',
            ],
            'Viewer' => [
                'view_leads', 'view_users', 'view_workspaces', 'view_roles', 'view_permissions', 'view_activity_logs', 'view_dashboard',
                'view_items', 'view_tax_rates', 'view_quotes', 'view_invoices',
            ],
        ];

        foreach ($roles as $roleName => $perms) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($perms);
            // Log activity for each role created
           
        }
    }
}