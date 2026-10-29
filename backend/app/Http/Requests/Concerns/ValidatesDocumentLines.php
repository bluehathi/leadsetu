<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Validation\Rule;

trait ValidatesDocumentLines
{
    /** Rules shared by quote and invoice forms. $required: false for partial updates. */
    protected function documentRules(bool $required): array
    {
        $workspace = $this->user()->workspace_id;
        $req = $required ? 'required' : 'sometimes';

        return [
            'company_id' => [$req, 'integer', Rule::exists('companies', 'id')->where('workspace_id', $workspace)],
            // The contact must work at the chosen company (and in this workspace).
            'contact_id' => ['nullable', 'integer', Rule::exists('contacts', 'id')->where('workspace_id', $workspace)
                ->where(fn ($q) => $this->input('company_id') ? $q->where('company_id', $this->input('company_id')) : $q)],
            'notes' => 'nullable|string|max:5000',
            'terms' => 'nullable|string|max:5000',
            'lines' => [$req, 'array', 'min:1', 'max:100'],
            'lines.*.item_id' => ['nullable', 'integer', Rule::exists('items', 'id')->where('workspace_id', $workspace)],
            'lines.*.description' => ['nullable', 'string', 'max:255', 'required_without:lines.*.item_id'],
            'lines.*.unit' => 'nullable|string|max:20',
            'lines.*.hsn_sac' => ['nullable', 'string', 'max:10', 'regex:/^[0-9A-Za-z]*$/'],
            'lines.*.quantity' => ['required', 'numeric', 'decimal:0,3', 'min:0.001', 'max:99999999'],
            // Amounts are integers in minor units (paise/cents): no floating point crosses the API.
            'lines.*.unit_price_minor' => ['nullable', 'integer', 'min:0', 'max:100000000000', 'required_without:lines.*.item_id'],
            'lines.*.discount_percent' => ['nullable', 'numeric', 'decimal:0,2', 'min:0', 'max:100'],
            'lines.*.tax_rate' => ['nullable', 'numeric', 'decimal:0,3', 'min:0', 'max:100'],
        ];
    }
}
