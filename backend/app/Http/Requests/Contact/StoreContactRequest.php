<?php

namespace App\Http\Requests\Contact;

use App\Models\Contact;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Contact::class);
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            // Must belong to the caller's own workspace.
            'company_id' => [
                'required',
                Rule::exists('companies', 'id')->where('workspace_id', $this->user()->workspace_id),
            ],
            'title' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ];
    }
}
