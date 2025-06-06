<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ActivityLog;

class ActivityLogPolicy
{
    public function viewAny(User $user)
    {
        return $user->can('view_activity_logs');
    }

    public function view(User $user, ActivityLog $log)
    {
        return $user->workspace_id === $log->workspace_id && $user->can('view_activity_logs');
    }
}
