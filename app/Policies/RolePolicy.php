<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Role;

class RolePolicy
{
    public function viewAny(User $user)
    {
        return $user->can('view_roles');
    }

    public function view(User $user, Role $role)
    {
        return $user->can('view_roles');
    }

    public function create(User $user)
    {
        return $user->can('create_roles');
    }

    public function update(User $user, Role $role)
    {
        return $user->can('edit_roles');
    }

    public function delete(User $user, Role $role)
    {
        return $user->can('delete_roles');
    }
}
