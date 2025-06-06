<?php

namespace App\Policies;

use App\Models\User;

class SettingsPolicy
{
    public function manage(User $user)
    {
        return $user->can('manage_settings');
    }
}
