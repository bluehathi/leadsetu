<?php

namespace App\Http\Requests\ProspectList;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProspectListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('prospect_list'));
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255',
                Rule::unique('prospect_lists', 'name')->ignore($this->route('prospect_list'))
                    ->where('workspace_id', $this->user()->workspace_id)],
            'description' => 'nullable|string|max:2000',
        ];
    }
}
