<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\EmailLog */
class EmailLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'contact_id' => $this->contact_id,
            'recipient_email' => $this->recipient_email,
            'recipient_name' => $this->recipient_name,
            'status' => $this->status,
            'sent_at' => $this->sent_at,
            'delivered_at' => $this->delivered_at,
            'opened_at' => $this->opened_at,
            'clicked_at' => $this->clicked_at,
            'failed_at' => $this->failed_at,
            'error_message' => $this->error_message,
        ];
    }
}
