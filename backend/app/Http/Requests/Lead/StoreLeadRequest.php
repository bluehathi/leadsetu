<?php

namespace App\Http\Requests\Lead;

use App\Models\Lead;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Lead::class);
    }

    public function rules(): array
    {
        $workspace = $this->user()->workspace_id;
        $own = fn (string $table) => Rule::exists($table, 'id')->where('workspace_id', $workspace);

        return [
            'name' => 'required|string|max:180',
            'email' => 'nullable|email|max:180',
            'phone' => 'nullable|string|max:20',
            'company' => 'nullable|string|max:180',
            'website' => 'nullable|string|max:180',
            'title' => 'nullable|string|max:180',
            'positions' => 'nullable|string|max:180',
            'notes' => 'nullable|string|max:5000',
            'status' => ['nullable', Rule::in(Lead::STATUSES)],
            'source' => ['nullable', Rule::in(Lead::SOURCES)],
            'priority' => ['nullable', Rule::in(Lead::PRIORITIES)],
            'tags' => 'nullable|array|max:20',
            'tags.*' => 'string|max:50',
            'deal_value' => 'nullable|integer|min:0|max:2000000000',
            'expected_close' => 'nullable|date',
            // Related records must belong to the caller's own workspace.
            'company_id' => ['nullable', $own('companies')],
            'contact_id' => ['nullable', $own('contacts')],
            'lead_owner' => ['nullable', $own('users')],
        ];
    }
}
