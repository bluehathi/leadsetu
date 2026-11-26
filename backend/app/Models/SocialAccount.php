<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SocialAccount extends Model
{
    use BelongsToWorkspace, HasFactory;

    public const PLATFORMS = ['youtube', 'instagram', 'facebook'];
    public const STATUSES = ['connected', 'needs_reauth', 'disconnected'];

    protected $fillable = [
        'social_brand_id',
        'platform',
        'account_name',
        'handle',
        'external_id',
        'avatar_url',
        'niche',
        'followers_count',
        'views_count',
        'posts_count',
        'engagement_rate',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'status',
        'notes',
        'last_synced_at',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
        'analytics_cache',
    ];

    protected $casts = [
        'access_token' => 'encrypted',
        'refresh_token' => 'encrypted',
        'token_expires_at' => 'datetime',
        'last_synced_at' => 'datetime',
        'analytics_cache' => 'array',
        'analytics_synced_at' => 'datetime',
        'followers_count' => 'integer',
        'views_count' => 'integer',
        'posts_count' => 'integer',
        'engagement_rate' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(SocialBrand::class, 'social_brand_id');
    }

    public function contents(): HasMany
    {
        return $this->hasMany(SocialContent::class);
    }

    public function competitors(): HasMany
    {
        return $this->hasMany(SocialCompetitor::class);
    }

    public function ideas(): HasMany
    {
        return $this->hasMany(SocialIdea::class);
    }
}
