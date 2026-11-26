<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Model;

class GoogleDriveFile extends Model
{
    use BelongsToWorkspace;

    protected $fillable = [
        'drive_file_id',
        'parent_folder_id',
        'name',
        'mime_type',
        'is_folder',
        'is_video',
        'is_image',
        'size',
        'thumbnail_url',
        'web_view_url',
        'modified_time',
        'duration_millis',
        'synced_at',
    ];

    protected $casts = [
        'is_folder' => 'boolean',
        'is_video' => 'boolean',
        'is_image' => 'boolean',
        'size' => 'integer',
        'duration_millis' => 'integer',
        'modified_time' => 'datetime',
        'synced_at' => 'datetime',
    ];
}
