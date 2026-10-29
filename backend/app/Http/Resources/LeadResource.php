<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Lead */
class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'company_name' => $this->getAttribute('company'),
            'website' => $this->website,
            'title' => $this->title,
            'positions' => $this->positions,
            'notes' => $this->notes,
            'status' => $this->status,
            'source' => $this->source,
            'priority' => $this->priority,
            'tags' => $this->tags ?? [],
            'score' => $this->score,
            'qualification' => $this->qualification,
            'deal_value' => $this->deal_value,
            'expected_close' => $this->expected_close?->toDateString(),
            'lead_owner' => $this->lead_owner !== null ? (int) $this->lead_owner : null,
            'company_id' => $this->company_id,
            'contact_id' => $this->contact_id,
            // The `company` attribute is the free-text name, so the relation is exposed under another key.
            'linked_company' => $this->relationLoaded('company') && $this->getRelation('company')
                ? new CompanyResource($this->getRelation('company')) : null,
            'linked_contact' => $this->relationLoaded('contact') && $this->getRelation('contact')
                ? new ContactResource($this->getRelation('contact')) : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
