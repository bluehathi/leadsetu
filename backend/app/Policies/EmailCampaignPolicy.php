<?php

namespace App\Policies;

use App\Models\EmailCampaign;
use App\Models\User;
use App\Policies\Concerns\ChecksWorkspace;

class EmailCampaignPolicy
{
    use ChecksWorkspace;

    public function viewAny(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('view_campaigns');
    }

    public function view(User $user, EmailCampaign $campaign): bool
    {
        return $this->sameWorkspace($user, $campaign) && $user->can('view_campaigns');
    }

    public function create(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('create_campaign');
    }

    public function update(User $user, EmailCampaign $campaign): bool
    {
        return $this->sameWorkspace($user, $campaign) && $user->can('edit_campaign');
    }

    public function delete(User $user, EmailCampaign $campaign): bool
    {
        return $this->sameWorkspace($user, $campaign) && $user->can('delete_campaign');
    }

    /** Sending, scheduling and cancelling a schedule all need the send permission. */
    public function send(User $user, EmailCampaign $campaign): bool
    {
        return $this->sameWorkspace($user, $campaign) && $user->can('send_campaign');
    }
}
