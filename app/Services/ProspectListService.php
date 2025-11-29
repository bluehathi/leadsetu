<?php

namespace App\Services;

use App\Models\ProspectList;
use Illuminate\Support\Facades\Auth;

class ProspectListService
{
    public function createProspectList(array $data): ProspectList
    {
        $user = Auth::user();
        $data['workspace_id'] = $user->workspace_id;
        return ProspectList::create($data);
    }

    public function updateProspectList(ProspectList $prospectList, array $data): ProspectList
    {
        $prospectList->update($data);
        return $prospectList;
    }

    public function deleteProspectList(ProspectList $prospectList): void
    {
        $prospectList->delete();
    }
}
