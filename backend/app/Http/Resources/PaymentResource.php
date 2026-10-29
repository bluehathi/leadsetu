<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Payment */
class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'invoice_id' => $this->invoice_id, 'amount_minor' => $this->amount_minor,
            'paid_at' => $this->paid_at?->toDateString(), 'method' => $this->method, 'reference' => $this->reference,
            'notes' => $this->notes, 'voided' => $this->voided_at !== null, 'void_reason' => $this->void_reason,
        ];
    }
}
