<?php

namespace App\Services;

use App\Models\Lead;
use Illuminate\Support\Facades\Auth;

class LeadService
{
    public function createLead(array $data): Lead
    {
        $user = Auth::user();
        $data['workspace_id'] = $user->workspace_id;
        return Lead::create($data);
    }

    public function updateLead(Lead $lead, array $data): Lead
    {
        $lead->update($data);
        return $lead;
    }

    public function deleteLead(Lead $lead): void
    {
        $lead->delete();
    }
}
