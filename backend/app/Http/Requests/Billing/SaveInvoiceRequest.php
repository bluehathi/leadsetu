<?php

namespace App\Http\Requests\Billing;

use App\Http\Requests\Concerns\ValidatesDocumentLines;
use App\Models\Invoice;
use Illuminate\Foundation\Http\FormRequest;

class SaveInvoiceRequest extends FormRequest
{
    use ValidatesDocumentLines;

    public function authorize(): bool
    {
        $invoice = $this->route('invoice');

        return $invoice ? $this->user()->can('update', $invoice) : $this->user()->can('create', Invoice::class);
    }

    public function rules(): array
    {
        return $this->documentRules(! $this->route('invoice')) + [
            'issue_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:issue_date',
        ];
    }
}
