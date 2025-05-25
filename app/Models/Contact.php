<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Scopes\WorkSpaceScope;

class Contact extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'workspace_id',
        'title',
        'notes',
        'company_id',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new WorkSpaceScope());
    }

    // If you have workspaces and want to link contacts to them:
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}