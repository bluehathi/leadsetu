<?php

namespace App\Policies;

use App\Models\User;
use App\Models\EmailCampaign;

class EmailCampaignPolicy
{
    public function viewAny(User $user)
    {
        return $user->can('view_campaigns');
    }

    public function view(User $user, EmailCampaign $campaign)
    {
        return $user->workspace_id === $campaign->workspace_id && $user->can('view_campaigns');
    }

    public function create(User $user)
    {
        return $user->can('create_campaign');
    }

    public function update(User $user, EmailCampaign $campaign)
    {
        return $user->workspace_id === $campaign->workspace_id && $user->can('edit_campaign');
    }

    public function delete(User $user, EmailCampaign $campaign)
    {
        return $user->workspace_id === $campaign->workspace_id && $user->can('delete_campaign');
    }

    public function send(User $user, EmailCampaign $campaign)
    {
        return $user->workspace_id === $campaign->workspace_id && $user->can('send_campaign');
    }
}
