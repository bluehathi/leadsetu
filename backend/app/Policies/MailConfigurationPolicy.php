<?php

namespace App\Policies;

use App\Models\MailConfiguration;
use App\Models\User;

class MailConfigurationPolicy
{
    /** Create/update/test the current workspace's SMTP settings. */
    public function manage(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('manage_smtp_settings');
    }

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
