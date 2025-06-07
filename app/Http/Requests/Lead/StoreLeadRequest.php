<?php

namespace App\Http\Requests\Lead;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'company_id' => 'nullable|exists:companies,id',
            'contact_id' => 'nullable|exists:contacts,id',
            'website' => 'nullable|string|max:255',
            'company' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'status' => 'nullable|string',
            'source' => 'nullable|string',
            'deal_value' => 'nullable|numeric',
            'expected_close' => 'nullable|date',
            'lead_score' => 'nullable|integer',
            'lead_owner' => 'nullable|integer',
            'priority' => 'nullable|string',
            'title' => 'nullable|string',
            'positions' => 'nullable|string',
            'tags' => 'nullable|string',
        ];
    }
}
