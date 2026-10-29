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
            // Companies
            'view_companies', 'create_companies', 'edit_companies', 'delete_companies',
            // Contacts
            'view_contacts', 'create_contacts', 'edit_contacts', 'delete_contacts',
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
            // Prospect Lists
            'view_prospect_lists', 'create_prospect_lists', 'edit_prospect_lists', 'delete_prospect_lists',
            // Dashboard
            'view_dashboard','workspace_owner',
            //settings
            'manage_settings','manage_smtp_settings',
            //email campaigns
            'view_campaigns','create_campaign','edit_campaign','delete_campaign','send_campaign',
            // billing: catalog, taxes, quotes, invoices, payments
            'manage_business_profile',
            'view_items', 'create_items', 'edit_items', 'delete_items',
            'view_tax_rates', 'manage_tax_rates',
            'view_quotes', 'create_quotes', 'edit_quotes', 'delete_quotes',
            'view_invoices', 'create_invoices', 'edit_invoices', 'delete_invoices', 'issue_invoices', 'void_invoices',
            'record_payments', 'void_payments',
        ];
        foreach ($permissions as $permission) {
            $perm = Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
           
           
        }
    }
}