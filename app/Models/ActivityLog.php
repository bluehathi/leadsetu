<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Scopes\WorkSpaceScope;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'workspace_id',
        'action',
        'subject_type',
        'subject_id',
        'description',
        'properties',
    ];

    protected $casts = [
        'properties' => 'array',
    ];
   
     protected static function booted(): void
    {
        static::addGlobalScope(new WorkSpaceScope());
    }


    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    
    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }
}
