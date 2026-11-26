<?php

namespace App\Policies;

use App\Models\SocialKeyword;
use App\Models\User;
use App\Policies\Concerns\ChecksWorkspace;

class SocialKeywordPolicy
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

    public function delete(User $user, SocialKeyword $keyword): bool
    {
        return $this->sameWorkspace($user, $keyword) && $user->can('use_growth_tools');
    }
}
