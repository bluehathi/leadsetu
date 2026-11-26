<?php

namespace App\Policies;

use App\Models\SocialIdea;
use App\Models\User;
use App\Policies\Concerns\ChecksWorkspace;

class SocialIdeaPolicy
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

    public function update(User $user, SocialIdea $idea): bool
    {
        return $this->sameWorkspace($user, $idea) && $user->can('use_growth_tools');
    }

    public function delete(User $user, SocialIdea $idea): bool
    {
        return $this->sameWorkspace($user, $idea) && $user->can('use_growth_tools');
    }
}
