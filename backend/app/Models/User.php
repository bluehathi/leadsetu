<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use App\Models\Workspace;
use Illuminate\Testing\Fluent\Concerns\Has;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'workspace_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'settings' => 'array',
    ];

    public function scopeRelatedToWorkspace($query)
    {
        return $query->where('workspace_id', auth()->user()->workspace_id);
    }

    /**
     * Resolve {user} route parameters inside the caller's workspace only, so a
     * user from another tenant is a 404 even before the policy runs.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        $query = $this->newQuery()->where($field ?? $this->getRouteKeyName(), $value);

        if ($actor = request()->user()) {
            $actor->workspace_id === null
                ? $query->whereRaw('1 = 0')
                : $query->where('workspace_id', $actor->workspace_id);
        }

        return $query->first();
    }

    /** Permission names this user holds (directly or via roles). */
    public function permissionNames(): array
    {
        return $this->getAllPermissions()->pluck('name')->all();
    }

    /** True when every given permission is also held by this user (no escalation). */
    public function holdsAll(iterable $permissions): bool
    {
        return array_diff(collect($permissions)->all(), $this->permissionNames()) === [];
    }

    /** A user may only manage accounts whose permissions are a subset of their own. */
    public function outranksOrEquals(User $other): bool
    {
        return $this->holdsAll($other->permissionNames());
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }
}
