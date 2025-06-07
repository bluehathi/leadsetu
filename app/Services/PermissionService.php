<?php

namespace App\Services;

use App\Models\Permission;

class PermissionService
{
    public function createPermission(array $data): Permission
    {
        return Permission::create($data);
    }

    public function updatePermission(Permission $permission, array $data): Permission
    {
        $permission->update($data);
        return $permission;
    }

    public function deletePermission(Permission $permission): void
    {
        $permission->delete();
    }
}
