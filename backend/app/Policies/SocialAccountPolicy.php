<?php

namespace App\Policies;

use App\Models\SocialAccount;
use App\Models\User;
use App\Policies\Concerns\ChecksWorkspace;

class SocialAccountPolicy
{
    use ChecksWorkspace;

    public function viewAny(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('view_social_accounts');
    }

    public function view(User $user, SocialAccount $account): bool
    {
        return $this->sameWorkspace($user, $account) && $user->can('view_social_accounts');
    }

    public function create(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('manage_social_accounts');
    }

    public function update(User $user, SocialAccount $account): bool
    {
        return $this->sameWorkspace($user, $account) && $user->can('manage_social_accounts');
    }

    public function delete(User $user, SocialAccount $account): bool
    {
        return $this->sameWorkspace($user, $account) && $user->can('manage_social_accounts');
    }
}
