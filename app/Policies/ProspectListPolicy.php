<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ProspectList;

class ProspectListPolicy
{
    /**
     * Determine whether the user can view any prospect lists.
     */
    public function viewAny(User $user)
    {
        // Must have permission to view prospect lists
        return $user->can('view_prospect_lists');
    }

    /**
     * Determine whether the user can view the prospect list.
     */
    public function view(User $user, ProspectList $prospectList)
    {
        // Must have permission and be in the same workspace
        return $user->workspace_id === $prospectList->workspace_id && $user->can('view_prospect_lists');
    }

    /**
     * Determine whether the user can create prospect lists.
     */
    public function create(User $user)
    {
        // Must have permission to create prospect lists
        return $user->can('create_prospect_lists');
    }

    /**
     * Determine whether the user can update the prospect list.
     */
    public function update(User $user, ProspectList $prospectList)
    {
        // Must have permission and be in the same workspace (owner or permission)
        return $user->workspace_id === $prospectList->workspace_id &&
            ($user->id === $prospectList->user_id || $user->can('edit_prospect_lists'));
    }

    /**
     * Determine whether the user can delete the prospect list.
     */
    public function delete(User $user, ProspectList $prospectList)
    {
        // Must have permission and be in the same workspace (owner or permission)
        return $user->workspace_id === $prospectList->workspace_id &&
            ($user->id === $prospectList->user_id || $user->can('delete_prospect_lists'));
    }
}
