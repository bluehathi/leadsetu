<?php

namespace App\Http\Requests\Billing;

use App\Models\BusinessProfile;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveBusinessProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage', BusinessProfile::class);
    }

    public function rules(): array
    {
        $in = $this->input('country') === 'IN';

        return [
            'legal_name' => 'required|string|max:255',
            'country' => ['required', Rule::in(array_keys(BusinessProfile::COUNTRIES))],
            'address_line1' => 'nullable|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:120',
            // India: two-digit GST state code ("27"); US: two-letter state ("CA").
            'state_code' => ['nullable', 'string', $in ? 'regex:/^(0[1-9]|[12][0-9]|3[0-9])$/' : 'regex:/^[A-Za-z]{2}$/'],
            'postal_code' => 'nullable|string|max:12',
            // GSTIN: 15 characters, e.g. 27AAPFU0939F1ZV. US: free-form tax id (EIN etc.).
            'tax_id' => ['nullable', 'string', 'max:20', $in ? 'regex:/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/' : 'regex:/^[0-9A-Za-z-]+$/'],
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:30',
            'fy_start_month' => 'nullable|integer|between:1,12',
            'invoice_prefix' => ['nullable', 'string', 'max:5', 'regex:/^[A-Za-z0-9]+$/'],
            'quote_prefix' => ['nullable', 'string', 'max:5', 'regex:/^[A-Za-z0-9]+$/'],
            'default_due_days' => 'nullable|integer|between:0,365',
            'default_terms' => 'nullable|string|max:5000',
        ];
    }

    protected function prepareForValidation(): void
    {
        // Codes are stored upper-case.
        foreach (['state_code', 'tax_id'] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => strtoupper(trim($this->input($field)))]);
            }
        }
    }
}
