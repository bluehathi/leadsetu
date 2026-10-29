<?php

namespace App\Http\Requests\ProspectList;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ManageContactsInListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('prospect_list'));
    }

    public function rules(): array
    {
        return [
            'contact_ids' => 'required|array|min:1|max:1000',
            // Only contacts of the caller's own workspace can be added or removed.
            'contact_ids.*' => ['integer', Rule::exists('contacts', 'id')->where('workspace_id', $this->user()->workspace_id)],
        ];
    }
}
