<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Company */
class CompanyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'website' => $this->website,
            'billing_email' => $this->billing_email,
            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'city' => $this->city,
            'state_code' => $this->state_code,
            'postal_code' => $this->postal_code,
            'country' => $this->country,
            'tax_id' => $this->tax_id,
            'tax_exempt' => (bool) $this->tax_exempt,
            'contacts_count' => $this->when(isset($this->contacts_count), fn () => $this->contacts_count),
            'created_at' => $this->created_at,
        ];
    }
}
