<?php

namespace App\Policies;

use App\Models\Item;
use App\Models\User;
use App\Policies\Concerns\ChecksWorkspace;

class ItemPolicy
{
    use ChecksWorkspace;

    public function viewAny(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('view_items');
    }

    public function view(User $user, Item $model): bool
    {
        return $this->sameWorkspace($user, $model) && $user->can('view_items');
    }

    public function create(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('create_items');
    }

    public function update(User $user, Item $model): bool
    {
        return $this->sameWorkspace($user, $model) && $user->can('edit_items');
    }

    public function delete(User $user, Item $model): bool
    {
        return $this->sameWorkspace($user, $model) && $user->can('delete_items');
    }
}
