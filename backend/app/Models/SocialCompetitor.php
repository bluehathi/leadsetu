<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialCompetitor extends Model
{
    use BelongsToWorkspace, HasFactory;

    public const PLATFORMS = ['youtube', 'instagram', 'facebook'];

    protected $fillable = [
        'social_account_id',
        'platform',
        'channel_name',
        'handle',
        'external_id',
        'followers_count',
        'avg_views',
        'engagement_rate',
        'top_video_title',
        'top_video_views',
        'last_checked_at',
    ];

    protected $casts = [
        'followers_count' => 'integer',
        'avg_views' => 'integer',
        'engagement_rate' => 'float',
        'top_video_views' => 'integer',
        'last_checked_at' => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(SocialAccount::class, 'social_account_id');
    }
}
