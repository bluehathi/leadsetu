<?php

namespace App\Http\Requests\Social;

use App\Models\SocialAccount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSocialAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'platform' => ['required', Rule::in(SocialAccount::PLATFORMS)],
            'account_name' => ['required', 'string', 'max:255'],
            'handle' => ['required', 'string', 'max:120'],
            'external_id' => ['nullable', 'string', 'max:255'],
            'avatar_url' => ['nullable', 'url', 'max:500'],
            'niche' => ['nullable', 'string', 'max:120'],
            'followers_count' => ['nullable', 'integer', 'min:0'],
            'views_count' => ['nullable', 'integer', 'min:0'],
            'posts_count' => ['nullable', 'integer', 'min:0'],
            'engagement_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'access_token' => ['nullable', 'string', 'max:4096'],
            'refresh_token' => ['nullable', 'string', 'max:4096'],
            'status' => ['nullable', Rule::in(SocialAccount::STATUSES)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
