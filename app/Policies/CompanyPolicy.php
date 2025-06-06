<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Company;

class CompanyPolicy
{
    public function viewAny(User $user)
    {
        return $user->can('view_companies');
    }

    public function view(User $user, Company $company)
    {
        return $user->workspace_id === $company->workspace_id && $user->can('view_companies');
    }

    public function create(User $user)
    {
        return $user->can('create_companies');
    }

    public function update(User $user, Company $company)
    {
        return $user->workspace_id === $company->workspace_id && $user->can('edit_companies');
    }

    public function delete(User $user, Company $company)
    {
        return $user->workspace_id === $company->workspace_id && $user->can('delete_companies');
    }
}
