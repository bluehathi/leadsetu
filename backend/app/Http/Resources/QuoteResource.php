<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

/** @mixin \App\Models\Quote */
class QuoteResource extends BillingDocumentResource
{
    public function toArray(Request $request): array
    {
        return $this->common($request) + [
            'valid_until' => $this->valid_until?->toDateString(),
            'is_expired' => $this->isExpired(),
            'editable' => $this->isEditable(),
            'invoice_id' => $this->invoice_id,
        ];
    }
}
