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
        'growth_strategy',
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
        'growth_strategy' => 'array',
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

    public static function defaultStrategyForPlatform(string $platform): array
    {
        return match ($platform) {
            'instagram' => [
                'goal' => 'Shares, saves & non-follower Reel reach',
                'cadence' => '1–2 Reels / day',
                'best_times' => ['09:00', '19:30'],
                'content_focus' => 'Reels + Carousels',
                'title_or_hook_rule' => '1–2 line scroll-stopping hook (15–60 chars)',
                'default_tags' => [],
                'default_hashtags' => [],
                'description_footer' => '',
                'default_first_comment' => '',
                'pin_first_comment' => true,
            ],
            'facebook' => [
                'goal' => 'Conversations, shares & link clicks',
                'cadence' => '1–2 posts or Reels / day',
                'best_times' => ['10:00', '20:00'],
                'content_focus' => 'Reels + Story-led posts',
                'title_or_hook_rule' => 'Conversational / question-led hook',
                'default_tags' => [],
                'default_hashtags' => [],
                'description_footer' => '',
                'default_first_comment' => '',
                'pin_first_comment' => true,
            ],
            default => [
                'goal' => 'Search discovery & retention',
                'cadence' => '5x / week (Shorts + Long-form)',
                'best_times' => ['08:00', '18:00'],
                'content_focus' => 'Shorts + Search-driven videos',
                'title_or_hook_rule' => '35–70 chars, primary keyword front-loaded',
                'default_tags' => [],
                'default_hashtags' => ['#Shorts'],
                'description_footer' => '',
                'default_first_comment' => '',
                'pin_first_comment' => true,
            ],
        };
    }

    public function resolvedGrowthStrategy(): array
    {
        return array_merge(
            self::defaultStrategyForPlatform((string) $this->platform),
            is_array($this->growth_strategy) ? $this->growth_strategy : []
        );
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
