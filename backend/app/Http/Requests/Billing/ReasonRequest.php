<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;

/** Voiding is always explained; the reason is kept with the record. */
class ReasonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // each controller action authorizes against its own policy method
    }

    public function rules(): array
    {
        return ['reason' => 'required|string|max:200'];
    }
}
