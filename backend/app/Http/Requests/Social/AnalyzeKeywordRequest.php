<?php

namespace App\Http\Requests\Social;

use App\Models\SocialKeyword;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AnalyzeKeywordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $workspaceId = $this->user()?->workspace_id;

        return [
            'keyword' => ['required', 'string', 'max:120'],
            'platform' => ['required', Rule::in(SocialKeyword::PLATFORMS)],
            'social_account_id' => [
                'nullable',
                'integer',
                Rule::exists('social_accounts', 'id')->where('workspace_id', $workspaceId),
            ],
        ];
    }
}
