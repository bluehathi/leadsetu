<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Shape shared by quotes and invoices. */
abstract class BillingDocumentResource extends JsonResource
{
    protected function common(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status,
            'company_id' => $this->company_id,
            'company' => $this->whenLoaded('company', fn () => ['id' => $this->company->id, 'name' => $this->company->name]),
            'contact_id' => $this->contact_id,
            'issue_date' => $this->issue_date?->toDateString(),
            'currency' => $this->currency,
            'country' => $this->country,
            'place_of_supply' => $this->place_of_supply,
            'subtotal_minor' => $this->subtotal_minor,
            'discount_minor' => $this->discount_minor,
            'tax_minor' => $this->tax_minor,
            'total_minor' => $this->total_minor,
            'tax_breakup' => $this->tax_breakup ?? [],
            'notes' => $this->notes,
            'terms' => $this->terms,
            'seller' => $this->seller_snapshot,
            'buyer' => $this->buyer_snapshot,
            'lines' => $this->whenLoaded('lines', fn () => $this->lines->map(fn ($l) => [
                'id' => $l->id, 'item_id' => $l->item_id, 'description' => $l->description, 'hsn_sac' => $l->hsn_sac, 'unit' => $l->unit,
                'quantity' => $l->quantity_milli / 1000, 'unit_price_minor' => $l->unit_price_minor,
                'discount_percent' => $l->discount_percent, 'tax_rate' => $l->tax_rate,
                'gross_minor' => $l->gross_minor, 'discount_minor' => $l->discount_minor, 'taxable_minor' => $l->taxable_minor,
                'tax_minor' => $l->tax_minor, 'total_minor' => $l->total_minor,
            ])->values()),
            'created_at' => $this->created_at,
        ];
    }
}
