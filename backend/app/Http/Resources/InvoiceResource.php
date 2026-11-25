<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

/** @mixin \App\Models\Invoice */
class InvoiceResource extends BillingDocumentResource
{
    public function toArray(Request $request): array
    {
        return $this->common($request) + [
            'due_date' => $this->due_date?->toDateString(),
            'amount_paid_minor' => $this->amount_paid_minor,
            'balance_minor' => $this->balance_minor,
            'is_overdue' => $this->isOverdue(),
            'editable' => $this->isDraft(),
            'quote_id' => $this->quote_id,
            'issued_at' => $this->issued_at,
            'voided_at' => $this->voided_at,
            'void_reason' => $this->void_reason,
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
        ];
    }
}
