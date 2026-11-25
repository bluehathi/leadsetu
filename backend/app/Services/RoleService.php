<?php

namespace App\Services;

use App\Models\Role;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class RoleService
{
    public function list(): Collection
    {
        return Role::query()->with('permissions')->withCount('users')->orderBy('name')->get();
    }

    /** workspace_id is assigned by the Role model from the authenticated user. */
    public function createRole(array $data): Role
    {
        $role = Role::create(['name' => $data['name'], 'guard_name' => 'web']);
        $role->syncPermissions($data['permissions'] ?? []);

        return $role;
    }

    public function updateRole(Role $role, array $data): Role
    {
        if (isset($data['name'])) {
            $role->update(['name' => $data['name']]);
        }
        if (array_key_exists('permissions', $data)) {
            $role->syncPermissions($data['permissions']);
        }

        return $role;
    }

    public function deleteRole(Role $role): void
    {
        if ($role->users()->exists()) {
            throw ValidationException::withMessages(['role' => ['This role is assigned to users. Reassign them first.']]);
        }

        $role->delete();
    }
}
