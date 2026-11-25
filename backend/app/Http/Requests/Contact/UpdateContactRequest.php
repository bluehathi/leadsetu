<?php

namespace App\Http\Requests\Contact;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('contact'));
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'company_id' => [
                'sometimes',
                'required',
                Rule::exists('companies', 'id')->where('workspace_id', $this->user()->workspace_id),
            ],
            'title' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ];
    }
}
