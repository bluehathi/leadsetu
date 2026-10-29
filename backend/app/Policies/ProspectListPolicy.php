<?php

namespace App\Policies;

use App\Models\ProspectList;
use App\Models\User;
use App\Policies\Concerns\ChecksWorkspace;

class ProspectListPolicy
{
    use ChecksWorkspace;

    public function viewAny(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('view_prospect_lists');
    }

    public function view(User $user, ProspectList $list): bool
    {
        return $this->sameWorkspace($user, $list) && $user->can('view_prospect_lists');
    }

    public function create(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('create_prospect_lists');
    }

    public function update(User $user, ProspectList $list): bool
    {
        return $this->sameWorkspace($user, $list) && $user->can('edit_prospect_lists');
    }

    public function delete(User $user, ProspectList $list): bool
    {
        return $this->sameWorkspace($user, $list) && $user->can('delete_prospect_lists');
    }
}
