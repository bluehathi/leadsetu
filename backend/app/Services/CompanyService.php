<?php

namespace App\Services;

use App\Models\Company;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class CompanyService
{
    private const SORTABLE = ['name', 'created_at'];

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Company::query()->withCount('contact as contacts_count');

        if (filled($filters['search'] ?? null)) {
            $term = '%' . $filters['search'] . '%';
            $query->where(fn ($q) => $q->where('name', 'like', $term)->orWhere('website', 'like', $term));
        }

        $sort = $filters['sort'] ?? 'name';
        $column = ltrim($sort, '-');
        $query->orderBy(in_array($column, self::SORTABLE, true) ? $column : 'name', str_starts_with($sort, '-') ? 'desc' : 'asc');

        return $query->paginate(min(max($perPage, 1), 100));
    }

    /** workspace_id is assigned by the BelongsToWorkspace trait, never from input. */
    public function createCompany(array $data): Company
    {
        return Company::create($data);
    }

    public function updateCompany(Company $company, array $data): Company
    {
        $company->update($data);

        return $company;
    }

    public function deleteCompany(Company $company): void
    {
        if ($company->contact()->exists()) {
            throw ValidationException::withMessages([
                'company' => ['This company still has contacts. Move or delete them first.'],
            ]);
        }

        $company->delete();
    }
}
