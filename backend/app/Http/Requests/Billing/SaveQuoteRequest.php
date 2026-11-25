<?php

namespace App\Http\Requests\Billing;

use App\Http\Requests\Concerns\ValidatesDocumentLines;
use App\Models\Quote;
use Illuminate\Foundation\Http\FormRequest;

class SaveQuoteRequest extends FormRequest
{
    use ValidatesDocumentLines;

    public function authorize(): bool
    {
        $quote = $this->route('quote');

        return $quote ? $this->user()->can('update', $quote) : $this->user()->can('create', Quote::class);
    }

    public function rules(): array
    {
        return $this->documentRules(! $this->route('quote')) + [
            'issue_date' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:issue_date',
        ];
    }
}
