<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    use \App\Models\Concerns\BelongsToWorkspace;

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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    }
