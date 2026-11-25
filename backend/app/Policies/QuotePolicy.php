<?php

namespace App\Policies;

use App\Models\Quote;
use App\Models\User;
use App\Policies\Concerns\ChecksWorkspace;

class QuotePolicy
{
    use ChecksWorkspace;

    public function viewAny(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('view_quotes');
    }

    public function view(User $user, Quote $model): bool
    {
        return $this->sameWorkspace($user, $model) && $user->can('view_quotes');
    }

    public function create(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('create_quotes');
    }

    public function update(User $user, Quote $model): bool
    {
        return $this->sameWorkspace($user, $model) && $user->can('edit_quotes');
    }

    public function delete(User $user, Quote $model): bool
    {
        return $this->sameWorkspace($user, $model) && $user->can('delete_quotes');
    }
}
