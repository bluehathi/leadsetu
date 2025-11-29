<?php

namespace App\Services;

use App\Models\Role;

class RoleService
{
    public function createRole(array $data): Role
    {
        return Role::create($data);
    }

    public function updateRole(Role $role, array $data): Role
    {
        $role->update($data);
        return $role;
    }

    public function deleteRole(Role $role): void
    {
        $role->delete();
    }
}
