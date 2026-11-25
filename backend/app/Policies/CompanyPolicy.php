<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\User;
use App\Policies\Concerns\ChecksWorkspace;

class CompanyPolicy
{
    use ChecksWorkspace;

    public function viewAny(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('view_companies');
    }

    public function view(User $user, Company $company): bool
    {
        return $this->sameWorkspace($user, $company) && $user->can('view_companies');
    }

    public function create(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('create_companies');
    }

    public function update(User $user, Company $company): bool
    {
        return $this->sameWorkspace($user, $company) && $user->can('edit_companies');
    }

    public function delete(User $user, Company $company): bool
    {
        return $this->sameWorkspace($user, $company) && $user->can('delete_companies');
    }
}
