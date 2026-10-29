<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\ProspectList;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class ProspectListService
{
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = ProspectList::query()->withCount('contacts');

        if (filled($filters['search'] ?? null)) {
            $query->where('name', 'like', '%' . $filters['search'] . '%');
        }

        return $query->orderBy('name')->paginate(min(max($perPage, 1), 100));
    }

    /** workspace_id comes from the BelongsToWorkspace trait; the creator is the signed-in user. */
    public function createProspectList(array $data): ProspectList
    {
        $list = new ProspectList($data);
        $list->user_id = Auth::id();
        $list->save();

        return $list;
    }

    public function updateProspectList(ProspectList $list, array $data): ProspectList
    {
        $list->update($data);

        return $list;
    }

    public function deleteProspectList(ProspectList $list): void
    {
        $list->delete();
    }

    public function members(ProspectList $list, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $list->contacts()
            ->with('company')
            ->when(filled($filters['search'] ?? null), fn ($q) => $q->where(
                fn ($q) => $q->where('contacts.name', 'like', '%' . $filters['search'] . '%')
                    ->orWhere('contacts.email', 'like', '%' . $filters['search'] . '%')))
            ->orderBy('contacts.name')
            ->paginate(min(max($perPage, 1), 100));
    }

    public function addContacts(ProspectList $list, array $contactIds): void
    {
        $now = now();
        $list->contacts()->syncWithoutDetaching(
            collect($contactIds)->mapWithKeys(fn ($id) => [$id => ['subscribed_at' => $now]])->all()
        );
    }

    public function removeContacts(ProspectList $list, array $contactIds): void
    {
        $list->contacts()->detach($contactIds);
    }
}
