<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('view_roles');
    }

    public function view(User $user, Role $role): bool
    {
        return $user->can('view_roles') && ($role->isSystem() || $role->workspace_id === $user->workspace_id);
    }

    public function create(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('create_roles');
    }

    /** System roles are shared templates; only a workspace's own custom roles can change. */
    public function update(User $user, Role $role): bool
    {
        return ! $role->isSystem() && $role->workspace_id === $user->workspace_id && $user->can('edit_roles');
    }

    public function delete(User $user, Role $role): bool
    {
        return ! $role->isSystem() && $role->workspace_id === $user->workspace_id && $user->can('delete_roles');
    }
}
