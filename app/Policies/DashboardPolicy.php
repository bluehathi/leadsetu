<?php

namespace App\Policies;

use App\Models\User;

class DashboardPolicy
{
    public function view(User $user)
    {
        return $user->can('view_dashboard');
    }
}
