<?php

namespace App\Services;

use App\Models\Company;
use Illuminate\Support\Facades\Auth;

class CompanyService
{
    public function createCompany(array $data): Company
    {
        $user = Auth::user();
        $data['workspace_id'] = $user->workspace_id;
        return Company::create($data);
    }

    public function updateCompany(Company $company, array $data): Company
    {
        $company->update($data);
        return $company;
    }

    public function deleteCompany(Company $company): void
    {
        $company->delete();
    }
}
