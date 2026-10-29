<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'workspace' => $this->whenLoaded('workspace', fn () => [
                'id' => $this->workspace?->id,
                'name' => $this->workspace?->name,
            ]),
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')),
            // For hiding/showing UI only. Policies on the server are the authority.
            'permissions' => $this->getAllPermissions()->pluck('name')->values(),
        ];
    }
}
