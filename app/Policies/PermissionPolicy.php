<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Permission;

class PermissionPolicy
{
    public function viewAny(User $user)
    {
        return $user->can('view_permissions');
    }

    public function view(User $user, Permission $permission)
    {
        return $user->can('view_permissions');
    }

    public function create(User $user)
    {
        return $user->can('create_permissions');
    }

    public function update(User $user, Permission $permission)
    {
        return $user->can('edit_permissions');
    }

    public function delete(User $user, Permission $permission)
    {
        return $user->can('delete_permissions');
    }
}
