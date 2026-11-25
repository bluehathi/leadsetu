<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\EmailCampaign */
class EmailCampaignResource extends JsonResource
{
    protected ?array $stats = null;

    public static function withStats($campaign, array $stats): static
    {
        $resource = new static($campaign);
        $resource->stats = $stats;

        return $resource;
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'subject' => $this->subject,
            // Bodies can be large; lists omit them.
            'body' => $this->when($request->route()?->getActionMethod() !== 'index', fn () => $this->body),
            'status' => $this->status,
            'editable' => $this->isEditable(),
            'scheduled_at' => $this->scheduled_at,
            'sent_at' => $this->sent_at,
            'failed_at' => $this->failed_at,
            'prospect_lists' => $this->whenLoaded('prospectLists', fn () => $this->prospectLists->map(
                fn ($l) => ['id' => $l->id, 'name' => $l->name]
            )->values()),
            'stats' => $this->when($this->stats !== null, $this->stats),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
