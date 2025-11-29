<?php

namespace App\Services;

use App\Models\EmailCampaign;
use Illuminate\Support\Facades\Auth;

class EmailCampaignService
{
    public function createEmailCampaign(array $data): EmailCampaign
    {
        $user = Auth::user();
        $data['workspace_id'] = $user->workspace_id;
        return EmailCampaign::create($data);
    }

    public function updateEmailCampaign(EmailCampaign $emailCampaign, array $data): EmailCampaign
    {
        $emailCampaign->update($data);
        return $emailCampaign;
    }

    public function deleteEmailCampaign(EmailCampaign $emailCampaign): void
    {
        $emailCampaign->delete();
    }
}
