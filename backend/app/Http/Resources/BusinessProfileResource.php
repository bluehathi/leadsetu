<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\BusinessProfile */
class BusinessProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return $this->resource->only([
            'legal_name', 'country', 'currency', 'address_line1', 'address_line2', 'city', 'state_code', 'postal_code',
            'tax_id', 'email', 'phone', 'fy_start_month', 'invoice_prefix', 'quote_prefix', 'default_due_days', 'default_terms',
        ]);
    }
}
