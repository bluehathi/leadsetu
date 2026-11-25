<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Item */
class ItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'type' => $this->type, 'name' => $this->name, 'sku' => $this->sku,
            'description' => $this->description, 'unit' => $this->unit, 'price_minor' => $this->price_minor,
            'hsn_sac' => $this->hsn_sac, 'active' => $this->active, 'tax_rate_id' => $this->tax_rate_id,
            'tax_rate' => new TaxRateResource($this->whenLoaded('taxRate')),
        ];
    }
}
