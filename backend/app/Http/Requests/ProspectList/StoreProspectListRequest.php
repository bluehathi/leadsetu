<?php

namespace App\Http\Requests\ProspectList;

use App\Models\ProspectList;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProspectListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', ProspectList::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255',
                Rule::unique('prospect_lists', 'name')->where('workspace_id', $this->user()->workspace_id)],
            'description' => 'nullable|string|max:2000',
        ];
    }
}
