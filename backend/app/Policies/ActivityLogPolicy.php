<?php

namespace App\Policies;

use App\Models\ActivityLog;
use App\Models\User;
use App\Policies\Concerns\ChecksWorkspace;

class ActivityLogPolicy
{
    use ChecksWorkspace;

    public function viewAny(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('view_activity_logs');
    }

    public function view(User $user, ActivityLog $log): bool
    {
        return $this->sameWorkspace($user, $log) && $user->can('view_activity_logs');
    }
}
