<?php

namespace App\Policies;

use App\Models\User;
use App\Models\MailConfiguration;

class MailConfigurationPolicy
{
    public function viewAny(User $user)
    {
        return $user->can('manage_smtp_settings');
    }

    public function view(User $user, MailConfiguration $config)
    {
        return $user->workspace_id === $config->workspace_id && $user->can('manage_smtp_settings');
    }

    public function update(User $user, MailConfiguration $config)
    {
        return $user->workspace_id === $config->workspace_id && $user->can('manage_smtp_settings');
    }
}
