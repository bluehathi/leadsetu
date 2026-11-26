<?php

namespace App\Http\Requests\Social;

use App\Models\SocialContent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSocialContentRequest extends FormRequest
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
                'sometimes',
                'integer',
                Rule::exists('social_accounts', 'id')->where('workspace_id', $workspaceId),
            ],
            'platform' => ['sometimes', Rule::in(SocialContent::PLATFORMS)],
            'content_type' => ['sometimes', Rule::in(SocialContent::TYPES)],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'hook' => ['nullable', 'string', 'max:1000'],
            'script' => ['nullable', 'string', 'max:20000'],
            'tags' => ['nullable', 'array', 'max:30'],
            'tags.*' => ['string', 'max:60'],
            'hashtags' => ['nullable', 'array', 'max:30'],
            'hashtags.*' => ['string', 'max:60'],
            'thumbnail_url' => ['nullable', 'url', 'max:500'],
            'target_keyword' => ['nullable', 'string', 'max:120'],
            'status' => ['sometimes', Rule::in(SocialContent::STATUSES)],
            'scheduled_at' => ['nullable', 'date'],
        ];
    }
}
