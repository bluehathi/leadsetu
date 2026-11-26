<?php

namespace App\Http\Requests\Social;

use App\Models\SocialContent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OptimizeContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'platform' => ['required', Rule::in(SocialContent::PLATFORMS)],
            'topic' => ['required', 'string', 'max:255'],
            'target_keyword' => ['nullable', 'string', 'max:120'],
            'niche' => ['nullable', 'string', 'max:120'],
        ];
    }
}
