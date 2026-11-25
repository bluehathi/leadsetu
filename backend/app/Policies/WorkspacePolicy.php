<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Workspace;

class WorkspacePolicy
{
    public function viewAny(User $user)
    {
        return $user->can('view_workspaces');
    }

    public function view(User $user, Workspace $workspace)
    {
        return $user->workspace_id === $workspace->id && $user->can('view_workspaces');
    }

    public function create(User $user)
    {
        return $user->can('create_workspaces');
    }

    public function update(User $user, Workspace $workspace)
    {
        return $user->workspace_id === $workspace->id && $user->can('edit_workspaces');
    }

    public function delete(User $user, Workspace $workspace)
    {
        return $user->workspace_id === $workspace->id && $user->can('delete_workspaces');
    }
}
