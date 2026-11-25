<?php

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\ChecksWorkspace;

class UserPolicy
{
    use ChecksWorkspace;

    public function viewAny(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('view_users');
    }

    public function view(User $user, User $model): bool
    {
        return $this->sameWorkspace($user, $model) && $user->can('view_users');
    }

    public function create(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('create_users');
    }

    /** Also requires holding every permission the target holds: no taking over a more powerful account. */
    public function update(User $user, User $model): bool
    {
        return $this->sameWorkspace($user, $model)
            && $user->can('edit_users')
            && ($user->is($model) || $user->outranksOrEquals($model));
    }

    public function delete(User $user, User $model): bool
    {
        return $this->sameWorkspace($user, $model)
            && ! $user->is($model)
            && $user->can('delete_users')
            && $user->outranksOrEquals($model);
    }
}
