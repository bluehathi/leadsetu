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
                'view leads', 'create leads', 'edit leads', 'delete leads',
                'view users', 'view workspaces',
                'view roles', 'view permissions',
                'view activity logs', 'view dashboard',
            ],
            'Sales' => [
                'view leads', 'create leads', 'edit leads',
                'view workspaces',
                'view dashboard',
            ],
            'Viewer' => [
                'view leads', 'view users', 'view workspaces', 'view roles', 'view permissions', 'view activity logs', 'view dashboard',
            ],
        ];

        foreach ($roles as $roleName => $perms) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($perms);
        }
    }
}