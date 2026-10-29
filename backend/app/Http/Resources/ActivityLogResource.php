<?php

namespace App\Http\Resources;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ActivityLog */
class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $properties = $this->properties;
        // Older rows were written as JSON strings and may predate write-time redaction.
        if (is_string($properties)) {
            $decoded = json_decode($properties, true);
            $properties = is_array($decoded) ? $decoded : [];
        }

        return [
            'id' => $this->id,
            'action' => $this->action,
            'description' => $this->description,
            'entity' => $this->subject_type ? class_basename($this->subject_type) : null,
            'entity_id' => $this->subject_id,
            'user' => $this->whenLoaded('user', fn () => $this->user ? ['id' => $this->user->id, 'name' => $this->user->name] : null),
            'properties' => ActivityLog::redact((array) $properties),
            'created_at' => $this->created_at,
        ];
    }
}
