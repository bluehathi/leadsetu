<?php

namespace App\Http\Requests\Lead;

use Illuminate\Validation\Rule;

class UpdateLeadRequest extends StoreLeadRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('lead'));
    }

    public function rules(): array
    {
        $rules = parent::rules();
        // Partial updates: only validate fields that were sent.
        $rules['name'] = 'sometimes|required|string|max:180';

        return $rules;
    }
}
