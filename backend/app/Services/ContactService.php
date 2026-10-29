<?php

namespace App\Services;

use App\Models\Contact;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ContactService
{
    private const SORTABLE = ['name', 'email', 'created_at'];

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Contact::query()->with('company');

        if (filled($filters['search'] ?? null)) {
            $term = '%' . $filters['search'] . '%';
            $query->where(fn ($q) => $q->where('name', 'like', $term)
                ->orWhere('email', 'like', $term)
                ->orWhere('phone', 'like', $term));
        }

        if (filled($filters['company_id'] ?? null)) {
            $query->where('company_id', $filters['company_id']);
        }

        $sort = $filters['sort'] ?? '-created_at';
        $column = ltrim($sort, '-');
        $query->orderBy(in_array($column, self::SORTABLE, true) ? $column : 'created_at', str_starts_with($sort, '-') ? 'desc' : 'asc');

        return $query->paginate(min(max($perPage, 1), 100));
    }

    /** workspace_id is assigned by the BelongsToWorkspace trait, never from input. */
    public function createContact(array $data): Contact
    {
        return Contact::create($data);
    }

    public function updateContact(Contact $contact, array $data): Contact
    {
        $contact->update($data);

        return $contact;
    }

    public function deleteContact(Contact $contact): void
    {
        $contact->delete();
    }
}
