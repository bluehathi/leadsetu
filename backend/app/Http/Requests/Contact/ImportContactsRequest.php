<?php

namespace App\Http\Requests\Contact;

use App\Models\Contact;
use Illuminate\Foundation\Http\FormRequest;

class ImportContactsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Contact::class);
    }

    public function rules(): array
    {
        return ['file' => 'required|file|mimes:csv,txt,xls,xlsx|max:2048'];
    }
}
