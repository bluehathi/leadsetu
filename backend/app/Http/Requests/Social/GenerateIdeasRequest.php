<?php

namespace App\Http\Requests\Social;

use App\Models\SocialIdea;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GenerateIdeasRequest extends FormRequest
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
            'platform' => ['nullable', Rule::in(SocialIdea::PLATFORMS)],
            'niche' => ['nullable', 'string', 'max:120'],
        ];
    }
}
