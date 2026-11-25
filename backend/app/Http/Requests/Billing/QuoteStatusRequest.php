<?php

namespace App\Http\Requests\Billing;

use App\Models\Quote;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuoteStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('quote'));
    }

    public function rules(): array
    {
        return ['status' => ['required', Rule::in(array_diff(Quote::STATUSES, ['invoiced']))]];
    }
}
