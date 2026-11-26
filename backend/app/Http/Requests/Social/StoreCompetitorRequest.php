<?php

namespace App\Http\Requests\Social;

use App\Models\SocialCompetitor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompetitorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $workspaceId = $this->user()?->workspace_id;

        return [
            'social_account_id' => [
                'nullable',
                'integer',
                Rule::exists('social_accounts', 'id')->where('workspace_id', $workspaceId),
            ],
            'platform' => ['required', Rule::in(SocialCompetitor::PLATFORMS)],
            'channel_name' => ['required', 'string', 'max:255'],
            'handle' => ['required', 'string', 'max:120'],
            'external_id' => ['nullable', 'string', 'max:255'],
            'followers_count' => ['nullable', 'integer', 'min:0'],
            'avg_views' => ['nullable', 'integer', 'min:0'],
            'engagement_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'top_video_title' => ['nullable', 'string', 'max:255'],
            'top_video_views' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
