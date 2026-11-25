<?php

namespace App\Http\Requests\Billing;

use App\Models\Item;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        $item = $this->route('item');

        return $item ? $this->user()->can('update', $item) : $this->user()->can('create', Item::class);
    }

    public function rules(): array
    {
        $first = $this->route('item') ? ['sometimes', 'required'] : ['required'];
        $workspace = $this->user()->workspace_id;

        return [
            'type' => [...$first, Rule::in(Item::TYPES)],
            'name' => [...$first, 'string', 'max:255'],
            'sku' => ['nullable', 'string', 'max:60',
                Rule::unique('items', 'sku')->ignore($this->route('item'))->where('workspace_id', $workspace)],
            'description' => 'nullable|string|max:5000',
            'unit' => 'nullable|string|max:20',
            'price_minor' => [...$first, 'integer', 'min:0', 'max:100000000000'],
            'tax_rate_id' => ['nullable', 'integer', Rule::exists('tax_rates', 'id')->where('workspace_id', $workspace)],
            'hsn_sac' => ['nullable', 'string', 'max:10', 'regex:/^[0-9A-Za-z]*$/'],
            'active' => 'sometimes|boolean',
        ];
    }
}
