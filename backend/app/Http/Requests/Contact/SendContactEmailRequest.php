<?php

namespace App\Http\Requests\Contact;

use Illuminate\Foundation\Http\FormRequest;

class SendContactEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('email', $this->route('contact'));
    }

    public function rules(): array
    {
        return [
            'subject' => 'required|string|max:255',
            'body' => 'required|string|max:100000',
        ];
    }
}
