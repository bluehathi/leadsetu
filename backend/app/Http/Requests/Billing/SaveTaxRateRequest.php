<?php

namespace App\Http\Requests\Billing;

use App\Models\TaxRate;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveTaxRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $rate = $this->route('tax_rate');

        return $rate ? $this->user()->can('update', $rate) : $this->user()->can('create', TaxRate::class);
    }

    public function rules(): array
    {
        $first = $this->route('tax_rate') ? ['sometimes', 'required'] : ['required'];

        return [
            'name' => [...$first, 'string', 'max:100',
                Rule::unique('tax_rates', 'name')->ignore($this->route('tax_rate'))->where('workspace_id', $this->user()->workspace_id)],
            'rate' => [...$first, 'numeric', 'decimal:0,3', 'min:0', 'max:100'],
            'is_default' => 'sometimes|boolean',
            'active' => 'sometimes|boolean',
        ];
    }
}
