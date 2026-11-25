<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('company'));
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'website' => 'nullable|string|max:255',
            'billing_email' => 'nullable|email|max:255',
            'address_line1' => 'nullable|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:120',
            'state_code' => ['nullable', 'string', 'max:2', 'regex:/^[0-9A-Za-z]{2}$/'],
            'postal_code' => 'nullable|string|max:12',
            'country' => 'nullable|string|size:2|alpha',
            'tax_id' => ['nullable', 'string', 'max:20', 'regex:/^[0-9A-Za-z-]+$/'],
            'tax_exempt' => 'sometimes|boolean',
        ];
    }
}
