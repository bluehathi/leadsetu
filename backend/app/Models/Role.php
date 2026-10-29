<?php

namespace App\Models;

use App\Models\Scopes\RoleVisibilityScope;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Spatie\Permission\Models\Role as SpatieRole;
use Spatie\Permission\PermissionRegistrar;

class Role extends SpatieRole
{
    protected $fillable = ['name', 'guard_name', 'workspace_id'];

    protected static function booted(): void
    {
        static::addGlobalScope(new RoleVisibilityScope());

        // Custom roles always belong to the creating user's workspace.
        static::creating(function (Role $role) {
            if (auth()->check()) {
                $role->workspace_id = auth()->user()->workspace_id;
            }
        });
    }

    /** Explicit relation: Spatie's resolves the user model from a guard attribute that is unset on count queries. */
    public function users(): MorphToMany
    {
        return $this->morphedByMany(
            User::class,
            'model',
            config('permission.table_names.model_has_roles'),
            app(PermissionRegistrar::class)->pivotRole,
            config('permission.column_names.model_morph_key'),
        );
    }

    public function isSystem(): bool
    {
        return $this->workspace_id === null;
    }
}
