<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user)
    {
        return $user->can('view_users');
    }

    public function view(User $user, User $model)
    {
        return $user->workspace_id === $model->workspace_id && $user->can('view_users');
    }

    public function create(User $user)
    {
        return $user->can('create_users');
    }

    public function update(User $user, User $model)
    {
        return $user->workspace_id === $model->workspace_id && $user->can('edit_users');
    }

    public function delete(User $user, User $model)
    {
        return $user->workspace_id === $model->workspace_id && $user->can('delete_users');
    }
}
