<?php

namespace App\Policies;

use App\Models\Lead;
use App\Models\User;
use App\Policies\Concerns\ChecksWorkspace;

class LeadPolicy
{
    use ChecksWorkspace;

    public function viewAny(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('view_leads');
    }

    public function view(User $user, Lead $lead): bool
    {
        return $this->sameWorkspace($user, $lead) && $user->can('view_leads');
    }

    public function create(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('create_leads');
    }

    public function update(User $user, Lead $lead): bool
    {
        return $this->sameWorkspace($user, $lead) && $user->can('edit_leads');
    }

    public function delete(User $user, Lead $lead): bool
    {
        return $this->sameWorkspace($user, $lead) && $user->can('delete_leads');
    }
}
