<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** A user as shown in user management (no permission dump, unlike /me). */
class ManagedUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->map(
                fn ($r) => ['id' => $r->id, 'name' => $r->name]
            )->values()),
            'created_at' => $this->created_at,
        ];
    }
}
