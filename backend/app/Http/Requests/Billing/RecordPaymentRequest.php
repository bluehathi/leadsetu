<?php

namespace App\Http\Requests\Billing;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecordPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('recordPayment', $this->route('invoice'));
    }

    public function rules(): array
    {
        return [
            'amount_minor' => 'required|integer|min:1|max:100000000000',
            'paid_at' => 'required|date|before_or_equal:today',
            'method' => ['required', Rule::in(Payment::METHODS)],
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ];
    }
}
