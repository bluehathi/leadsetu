<?php

namespace App\Policies;

use App\Models\SocialCompetitor;
use App\Models\User;
use App\Policies\Concerns\ChecksWorkspace;

class SocialCompetitorPolicy
{
    use ChecksWorkspace;

    public function viewAny(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('view_social_accounts');
    }

    public function create(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('use_growth_tools');
    }

    public function delete(User $user, SocialCompetitor $competitor): bool
    {
        return $this->sameWorkspace($user, $competitor) && $user->can('use_growth_tools');
    }
}
