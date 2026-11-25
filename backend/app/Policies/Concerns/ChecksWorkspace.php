<?php

namespace App\Policies\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

trait ChecksWorkspace
{
    protected function sameWorkspace(User $user, Model $model): bool
    {
        return $user->workspace_id !== null && $user->workspace_id === $model->workspace_id;
    }
}
