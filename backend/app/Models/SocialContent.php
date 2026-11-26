<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialContent extends Model
{
    use BelongsToWorkspace, HasFactory;

    public const PLATFORMS = ['youtube', 'instagram', 'facebook'];
    public const TYPES = ['video', 'short', 'reel', 'post', 'carousel'];
    public const STATUSES = ['idea', 'draft', 'scheduled', 'published'];

    protected $fillable = [
        'social_account_id',
        'platform',
        'content_type',
        'title',
        'description',
        'first_comment',
        'pin_first_comment',
        'hook',
        'script',
        'tags',
        'hashtags',
        'thumbnail_url',
        'drive_folder_id',
        'drive_folder_name',
        'drive_file_id',
        'drive_file_name',
        'drive_file_url',
        'drive_mime_type',
        'drive_thumbnail_file_id',
        'youtube_video_id',
        'instagram_media_id',
        'published_url',
        'first_comment_id',
        'publish_error',
        'first_comment_error',
        'target_keyword',
        'status',
        'scheduled_at',
        'published_at',
        'seo_score',
        'seo_breakdown',
        'views_count',
        'likes_count',
        'comments_count',
    ];

    protected $casts = [
        'tags' => 'array',
        'hashtags' => 'array',
        'seo_breakdown' => 'array',
        'scheduled_at' => 'datetime',
        'published_at' => 'datetime',
        'pin_first_comment' => 'boolean',
        'seo_score' => 'integer',
        'views_count' => 'integer',
        'likes_count' => 'integer',
        'comments_count' => 'integer',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(SocialAccount::class, 'social_account_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
