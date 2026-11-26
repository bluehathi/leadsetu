<?php

namespace App\Policies;

use App\Models\SocialContent;
use App\Models\User;
use App\Policies\Concerns\ChecksWorkspace;

class SocialContentPolicy
{
    use ChecksWorkspace;

    public function viewAny(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('view_social_accounts');
    }

    public function view(User $user, SocialContent $content): bool
    {
        return $this->sameWorkspace($user, $content) && $user->can('view_social_accounts');
    }

    public function create(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('manage_social_content');
    }

    public function update(User $user, SocialContent $content): bool
    {
        return $this->sameWorkspace($user, $content) && $user->can('manage_social_content');
    }

    public function delete(User $user, SocialContent $content): bool
    {
        return $this->sameWorkspace($user, $content) && $user->can('manage_social_content');
    }
}
