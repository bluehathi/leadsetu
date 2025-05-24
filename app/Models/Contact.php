<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
    ];

    // If you have workspaces and want to link contacts to them:
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}