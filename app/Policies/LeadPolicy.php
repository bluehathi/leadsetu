<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Lead;

class LeadPolicy
{
    public function viewAny(User $user)
    {
        return $user->can('view_leads');
    }

    public function view(User $user, Lead $lead)
    {
        return $user->workspace_id === $lead->workspace_id && $user->can('view_leads');
    }

    public function create(User $user)
    {
        return $user->can('create_leads');
    }

    public function update(User $user, Lead $lead)
    {
        return $user->workspace_id === $lead->workspace_id && $user->can('edit_leads');
    }

    public function delete(User $user, Lead $lead)
    {
        return $user->workspace_id === $lead->workspace_id && $user->can('delete_leads');
    }
}
