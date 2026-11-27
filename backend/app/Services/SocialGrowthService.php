<?php

namespace App\Services;

use App\Models\SocialAccount;
use App\Models\SocialCompetitor;
use App\Models\SocialContent;
use App\Models\SocialIdea;
use App\Models\SocialKeyword;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class SocialGrowthService
{
    public function overview(?string $platform = null): array
    {
        $accountsQuery = SocialAccount::query();
        $contentsQuery = SocialContent::query();
        $ideasQuery = SocialIdea::query()->where('status', 'new');

        if ($platform && in_array($platform, SocialAccount::PLATFORMS, true)) {
            $accountsQuery->where('platform', $platform);
            $contentsQuery->where('platform', $platform);
            $ideasQuery->where('platform', $platform);
        }

        $accounts = $accountsQuery->latest()->get();
        $avgSeo = (int) round((float) $contentsQuery->clone()->avg('seo_score'));

        return [
            'totals' => [
                'accounts' => $accounts->count(),
                'youtube_accounts' => $accounts->where('platform', 'youtube')->count(),
                'instagram_accounts' => $accounts->where('platform', 'instagram')->count(),
                'facebook_accounts' => $accounts->where('platform', 'facebook')->count(),
                'followers' => (int) $accounts->sum('followers_count'),
                'views' => (int) $accounts->sum('views_count'),
                'avg_engagement' => $accounts->count() > 0
                    ? round((float) $accounts->avg('engagement_rate'), 2)
                    : 0.0,
                'avg_seo_score' => $avgSeo,
                'scheduled_count' => $contentsQuery->clone()->where('status', 'scheduled')->count(),
                'published_count' => $contentsQuery->clone()->where('status', 'published')->count(),
                'open_ideas_count' => $ideasQuery->count(),
            ],
            'accounts' => $accounts,
        ];
    }

    /**
     * Compute a deterministic vidIQ-style 0-100 SEO score and actionable checklist.
     */
    public function scoreContent(array $data): array
    {
        $platform = $data['platform'] ?? 'youtube';
        $contentType = $data['content_type'] ?? 'video';
        $title = trim((string) ($data['title'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        $hook = trim((string) ($data['hook'] ?? ''));
        $firstComment = trim((string) ($data['first_comment'] ?? ''));
        $keyword = mb_strtolower(trim((string) ($data['target_keyword'] ?? '')));
        $tags = array_values(array_filter((array) ($data['tags'] ?? [])));
        $hashtags = array_values(array_filter((array) ($data['hashtags'] ?? [])));

        if ($platform === 'instagram') {
            return $this->scoreInstagramContent($title, $description, $hook, $firstComment, $keyword, $hashtags, $contentType);
        }
        if ($platform === 'facebook') {
            return $this->scoreFacebookContent($title, $description, $hook, $firstComment, $keyword, $hashtags);
        }

        $checks = [];
        $score = 0;

        // 1. Title length & punchiness (20 pts)
        $titleLen = mb_strlen($title);
        $idealTitle = $titleLen >= 35 && $titleLen <= 70;
        $titlePts = $idealTitle ? 20 : ($titleLen >= 10 ? 10 : 0);
        $score += $titlePts;
        $checks[] = [
            'key' => 'title_length',
            'label' => 'Title length (35–70 chars)',
            'passed' => $idealTitle,
            'points' => $titlePts,
            'max' => 20,
        ];

        // 2. Target keyword in title (20 pts)
        $kwInTitle = $keyword !== '' && str_contains(mb_strtolower($title), $keyword);
        $kwTitlePts = $kwInTitle ? 20 : ($keyword === '' ? 5 : 0);
        $score += $kwTitlePts;
        $checks[] = [
            'key' => 'keyword_in_title',
            'label' => 'Target keyword in title',
            'passed' => $kwInTitle,
            'points' => $kwTitlePts,
            'max' => 20,
        ];

        // 3. Description depth (20 pts)
        $descLen = mb_strlen($description);
        $goodDesc = $descLen >= 120;
        $descPts = $goodDesc ? 20 : ($descLen >= 40 ? 10 : 0);
        $score += $descPts;
        $checks[] = [
            'key' => 'description_depth',
            'label' => 'Description depth (120+ chars)',
            'passed' => $goodDesc,
            'points' => $descPts,
            'max' => 20,
        ];

        // 4. Tags volume (20 pts)
        $tagCount = count($tags);
        $goodTags = $tagCount >= 5;
        $tagPts = $goodTags ? 20 : ($tagCount >= 2 ? 10 : 0);
        $score += $tagPts;
        $checks[] = [
            'key' => 'tags_count',
            'label' => 'At least 5 relevant tags',
            'passed' => $goodTags,
            'points' => $tagPts,
            'max' => 20,
        ];

        // 5. Opening Hook + Keyword in description (20 pts)
        $hasHook = mb_strlen($hook) >= 12;
        $kwInDesc = $keyword !== '' && str_contains(mb_strtolower($description), $keyword);
        $hookPts = ($hasHook ? 10 : 0) + ($kwInDesc ? 10 : 0);
        $score += $hookPts;
        $checks[] = [
            'key' => 'hook_and_kw_desc',
            'label' => 'Strong opening hook & keyword in description',
            'passed' => $hasHook && $kwInDesc,
            'points' => $hookPts,
            'max' => 20,
        ];

        return [
            'seo_score' => min(100, max(0, $score)),
            'seo_breakdown' => $checks,
        ];
    }

    protected function scoreInstagramContent(
        string $title,
        string $description,
        string $hook,
        string $firstComment,
        string $keyword,
        array $hashtags,
        string $contentType
    ): array {
        $checks = [];
        $score = 0;

        $hookText = $hook !== '' ? $hook : $title;
        $hookLen = mb_strlen($hookText);
        $idealHook = $hookLen >= 15 && $hookLen <= 60;
        $hookPts = $idealHook ? 20 : ($hookLen >= 8 ? 10 : 0);
        $score += $hookPts;
        $checks[] = [
            'key' => 'ig_hook',
            'label' => 'Scroll-stopping hook (15–60 chars)',
            'passed' => $idealHook,
            'points' => $hookPts,
            'max' => 20,
        ];

        $kwMatch = $keyword !== '' && (str_contains(mb_strtolower($hookText.' '.$description), $keyword));
        $kwPts = $kwMatch ? 20 : ($keyword === '' ? 5 : 0);
        $score += $kwPts;
        $checks[] = [
            'key' => 'ig_keyword',
            'label' => 'Topic/keyword in hook or caption',
            'passed' => $kwMatch,
            'points' => $kwPts,
            'max' => 20,
        ];

        $descLen = mb_strlen($description);
        $goodCaption = $descLen >= 80;
        $capPts = $goodCaption ? 20 : ($descLen >= 30 ? 10 : 0);
        $score += $capPts;
        $checks[] = [
            'key' => 'ig_caption',
            'label' => 'Caption value & CTA (80+ chars)',
            'passed' => $goodCaption,
            'points' => $capPts,
            'max' => 20,
        ];

        $hashCount = count($hashtags);
        $goodHash = $hashCount >= 5 && $hashCount <= 15;
        $hashPts = $goodHash ? 20 : (($hashCount >= 2 && $hashCount <= 20) ? 10 : 0);
        $score += $hashPts;
        $checks[] = [
            'key' => 'ig_hashtags',
            'label' => '5–15 targeted hashtags',
            'passed' => $goodHash,
            'points' => $hashPts,
            'max' => 20,
        ];

        $isReelOrCarousel = in_array($contentType, ['reel', 'carousel'], true);
        $hasComment = $firstComment !== '';
        $extraPts = ($isReelOrCarousel ? 10 : 0) + ($hasComment ? 10 : 0);
        $score += $extraPts;
        $checks[] = [
            'key' => 'ig_reel_comment',
            'label' => 'Reel/Carousel format & first comment CTA',
            'passed' => $isReelOrCarousel && $hasComment,
            'points' => $extraPts,
            'max' => 20,
        ];

        return ['seo_score' => min(100, max(0, $score)), 'seo_breakdown' => $checks];
    }

    protected function scoreFacebookContent(
        string $title,
        string $description,
        string $hook,
        string $firstComment,
        string $keyword,
        array $hashtags
    ): array {
        $checks = [];
        $score = 0;

        $leadText = $hook !== '' ? $hook : $title;
        $leadLen = mb_strlen($leadText);
        $idealLead = $leadLen >= 15 && $leadLen <= 80;
        $leadPts = $idealLead ? 20 : ($leadLen >= 8 ? 10 : 0);
        $score += $leadPts;
        $checks[] = [
            'key' => 'fb_hook',
            'label' => 'Conversational hook (15–80 chars)',
            'passed' => $idealLead,
            'points' => $leadPts,
            'max' => 20,
        ];

        $kwMatch = $keyword !== '' && str_contains(mb_strtolower($leadText.' '.$description), $keyword);
        $kwPts = $kwMatch ? 20 : ($keyword === '' ? 5 : 0);
        $score += $kwPts;
        $checks[] = [
            'key' => 'fb_keyword',
            'label' => 'Topic/keyword in post',
            'passed' => $kwMatch,
            'points' => $kwPts,
            'max' => 20,
        ];

        $descLen = mb_strlen($description);
        $goodDesc = $descLen >= 80;
        $descPts = $goodDesc ? 20 : ($descLen >= 30 ? 10 : 0);
        $score += $descPts;
        $checks[] = [
            'key' => 'fb_caption',
            'label' => 'Story/post depth (80+ chars)',
            'passed' => $goodDesc,
            'points' => $descPts,
            'max' => 20,
        ];

        $hashCount = count($hashtags);
        $goodHash = $hashCount <= 5;
        $hashPts = $goodHash ? 20 : ($hashCount <= 10 ? 10 : 0);
        $score += $hashPts;
        $checks[] = [
            'key' => 'fb_hashtags',
            'label' => 'Focused hashtags (0–5 tags)',
            'passed' => $goodHash,
            'points' => $hashPts,
            'max' => 20,
        ];

        $hasComment = $firstComment !== '';
        $commentPts = $hasComment ? 20 : (mb_strlen($hook) >= 12 ? 10 : 0);
        $score += $commentPts;
        $checks[] = [
            'key' => 'fb_first_comment',
            'label' => 'Link / engagement CTA in first comment',
            'passed' => $hasComment,
            'points' => $commentPts,
            'max' => 20,
        ];

        return ['seo_score' => min(100, max(0, $score)), 'seo_breakdown' => $checks];
    }

    /**
     * Adapt a source SocialContent item to a target channel's platform & growth_strategy.
     */
    public function adaptContentForAccount(SocialContent $source, SocialAccount $target): array
    {
        $strategy = $target->resolvedGrowthStrategy();
        $contentType = match ($target->platform) {
            'youtube' => in_array($source->content_type, ['reel', 'short'], true) ? 'short' : 'video',
            'instagram' => in_array($source->content_type, ['short', 'video', 'reel'], true)
                ? 'reel'
                : (in_array($source->content_type, ['carousel', 'post'], true) ? $source->content_type : 'post'),
            default => in_array($source->content_type, ['reel', 'post', 'video'], true) ? $source->content_type : 'post',
        };

        $description = trim((string) ($source->description ?? ''));
        $footer = trim((string) ($strategy['description_footer'] ?? ''));
        if ($footer !== '' && ! str_contains($description, $footer)) {
            $description = $description !== '' ? $description."\n\n".$footer : $footer;
        }

        $tags = $target->platform === 'youtube'
            ? (! empty($source->tags) ? $source->tags : ($strategy['default_tags'] ?? []))
            : ($source->tags ?? []);

        $defaultHashtags = array_values(array_filter((array) ($strategy['default_hashtags'] ?? [])));
        $hashtags = ! empty($defaultHashtags) ? $defaultHashtags : ($source->hashtags ?? []);
        if ($target->platform === 'facebook' && count($hashtags) > 5) {
            $hashtags = array_slice($hashtags, 0, 5);
        }

        $defaultComment = trim((string) ($strategy['default_first_comment'] ?? ''));
        $firstComment = $defaultComment !== '' ? $defaultComment : $source->first_comment;
        $pinFirstComment = array_key_exists('pin_first_comment', $strategy)
            ? (bool) $strategy['pin_first_comment']
            : (bool) $source->pin_first_comment;

        return [
            'social_account_id' => $target->id,
            'platform' => $target->platform,
            'content_type' => $contentType,
            'title' => $source->title,
            'description' => $description !== '' ? $description : null,
            'first_comment' => $firstComment,
            'pin_first_comment' => $pinFirstComment,
            'contains_ai_content' => (bool) $source->contains_ai_content,
            'hook' => $source->hook,
            'script' => $source->script,
            'tags' => $tags,
            'hashtags' => $hashtags,
            'thumbnail_url' => $source->thumbnail_url,
            'drive_folder_id' => $source->drive_folder_id,
            'drive_folder_name' => $source->drive_folder_name,
            'drive_file_id' => $source->drive_file_id,
            'drive_file_name' => $source->drive_file_name,
            'drive_file_url' => $source->drive_file_url,
            'drive_mime_type' => $source->drive_mime_type,
            'drive_thumbnail_file_id' => $source->drive_thumbnail_file_id,
            'target_keyword' => $source->target_keyword,
            'status' => $source->status === 'published' ? 'draft' : $source->status,
            'scheduled_at' => $source->scheduled_at,
        ];
    }

    /**
     * Generate vidIQ-style optimized titles, hook, description, tags, and hashtags.
     */
    public function optimizeContent(array $input): array
    {
        $platform = $input['platform'] ?? 'youtube';
        $topic = trim((string) ($input['topic'] ?? $input['title'] ?? 'Growth Strategy'));
        $keyword = trim((string) ($input['target_keyword'] ?? $topic));
        $niche = trim((string) ($input['niche'] ?? 'Creator Growth'));
        $slug = Str::slug($keyword, '');

        if ($platform === 'youtube') {
            $titles = [
                "How to Master {$keyword} in 2026 (Step-by-Step)",
                "{$keyword}: 7 Proven Tactics Nobody Talks About",
                "Stop Making These {$keyword} Mistakes! ({$niche} Guide)",
            ];
            $hook = "Most creators struggle with {$keyword} because they miss one simple retention trigger in the first 15 seconds.";
            $description = "In this video, we break down {$keyword} for {$niche} so you can boost CTR, retention, and subscribers.\n\n"
                ."What you'll learn:\n• The exact {$keyword} framework\n• Common mistakes to avoid\n• Actionable checklist to apply today\n\n"
                ."Subscribe for weekly {$niche} breakdowns!";
        } else {
            $titles = [
                "Save this {$keyword} checklist before your next Reel",
                "3 {$keyword} hooks that doubled our reach in 14 days",
                "The {$keyword} blueprint for {$niche} accounts",
            ];
            $hook = "If your {$niche} Reels stop at 300 views, fix this {$keyword} mistake today.";
            $description = "Save this post for your next {$keyword} sprint!\n\n"
                ."Here is the 3-step {$niche} framework we use to turn views into followers and DMs:\n"
                ."1. Lead with a pattern-interrupt hook\n2. Deliver one clear takeaway on {$keyword}\n3. End with a save/share CTA.\n\n"
                ."Comment \"GROW\" if you want the template.";
        }

        $tags = [
            strtolower($keyword),
            strtolower("{$keyword} tips"),
            strtolower("{$keyword} 2026"),
            strtolower($niche),
            strtolower("{$platform} growth"),
            strtolower("{$keyword} tutorial"),
        ];

        $hashtags = [
            "#{$slug}",
            '#'.Str::slug($niche, ''),
            $platform === 'youtube' ? '#YouTubeGrowth' : '#InstagramReels',
            '#ContentStrategy',
            '#CreatorTips',
            '#ViralHooks',
        ];

        $scored = $this->scoreContent([
            'platform' => $platform,
            'title' => $titles[0],
            'description' => $description,
            'hook' => $hook,
            'target_keyword' => $keyword,
            'tags' => $tags,
            'hashtags' => $hashtags,
        ]);

        return [
            'suggested_titles' => $titles,
            'recommended_title' => $titles[0],
            'hook' => $hook,
            'description' => $description,
            'tags' => $tags,
            'hashtags' => $hashtags,
            'seo_score' => $scored['seo_score'],
            'seo_breakdown' => $scored['seo_breakdown'],
        ];
    }

    /**
     * Analyze a keyword and persist/update it in the workspace's keyword vault.
     */
    public function analyzeKeyword(string $keyword, string $platform = 'youtube', ?int $socialAccountId = null): SocialKeyword
    {
        $clean = trim($keyword);
        $hash = crc32(mb_strtolower($clean).'|'.$platform);

        $volume = 1200 + ($hash % 85000);
        $competition = 18 + ($hash % 72);
        $volumeScore = min(100, (int) round(($volume / 85000) * 100));
        $overall = max(10, min(99, (int) round(($volumeScore * 0.6) + ((100 - $competition) * 0.4))));
        $trends = ['rising', 'steady', 'declining'];
        $trend = $trends[$hash % 3 === 2 ? 1 : ($overall >= 60 ? 0 : ($hash % 3))];

        $related = [
            "{$clean} tutorial",
            "{$clean} tips",
            "best {$clean} strategy",
            "{$clean} for beginners",
            "{$clean} 2026",
        ];

        return SocialKeyword::updateOrCreate(
            [
                'keyword' => $clean,
                'platform' => $platform,
            ],
            [
                'social_account_id' => $socialAccountId,
                'search_volume' => $volume,
                'competition_score' => $competition,
                'overall_score' => $overall,
                'trend' => $trend,
                'related_tags' => $related,
            ]
        );
    }

    /**
     * Refresh account metrics timestamp (hook point for live YT/IG API sync).
     */
    public function syncAccount(SocialAccount $account): SocialAccount
    {
        $account->forceFill([
            'last_synced_at' => Carbon::now(),
            'status' => $account->status === 'disconnected' ? 'connected' : $account->status,
        ])->save();

        return $account->fresh();
    }

    /**
     * Generate daily vidIQ-style content ideas for an account or workspace.
     */
    public function generateIdeas(?SocialAccount $account = null, ?string $platform = null, ?string $niche = null): array
    {
        $resolvedPlatform = $account?->platform ?? $platform ?? 'youtube';
        $resolvedNiche = trim((string) ($niche ?: $account?->niche ?: 'Digital Growth'));
        $label = $account ? "{$account->account_name} ({$account->handle})" : $resolvedNiche;

        $templates = $resolvedPlatform === 'youtube'
            ? [
                [
                    'title' => "Why 90% Fail at {$resolvedNiche} (And How to Fix It)",
                    'hook' => "If you're doing {$resolvedNiche} the 2024 way, your CTR is paying the price.",
                    'angle' => 'Contrarian Breakdown',
                    'predicted_score' => 88,
                ],
                [
                    'title' => "My Exact {$resolvedNiche} Workflow for {$label}",
                    'hook' => 'Here is the 15-minute system we use every week without burning out.',
                    'angle' => 'Behind-the-Scenes System',
                    'predicted_score' => 84,
                ],
                [
                    'title' => "5 {$resolvedNiche} Tools That Actually Move the Needle",
                    'hook' => "Skip the hype—only these 5 tools survived our 30-day test.",
                    'angle' => 'Curated Stack',
                    'predicted_score' => 81,
                ],
            ]
            : [
                [
                    'title' => "3-Second Hook Formula for {$resolvedNiche} Reels",
                    'hook' => 'Stop scrolling if your Reels die under 500 views.',
                    'angle' => 'Reel Hook Tutorial',
                    'predicted_score' => 90,
                ],
                [
                    'title' => "Carousel: {$resolvedNiche} Checklist to Save & Share",
                    'hook' => 'Swipe through the 6-step checklist we use for every client account.',
                    'angle' => 'Saveable Carousel',
                    'predicted_score' => 85,
                ],
                [
                    'title' => "Case Study: Growing {$resolvedNiche} Reach by 3x",
                    'hook' => 'We changed one thing in our caption + audio timing—here is the result.',
                    'angle' => 'Proof & Case Study',
                    'predicted_score' => 82,
                ],
            ];

        $created = [];
        foreach ($templates as $tpl) {
            $created[] = SocialIdea::create([
                'social_account_id' => $account?->id,
                'platform' => $resolvedPlatform,
                'title' => $tpl['title'],
                'hook' => $tpl['hook'],
                'angle' => $tpl['angle'],
                'predicted_score' => $tpl['predicted_score'],
                'status' => 'new',
            ]);
        }

        return $created;
    }

    public function convertIdeaToDraft(SocialIdea $idea, int $socialAccountId): SocialContent
    {
        $scored = $this->scoreContent([
            'platform' => $idea->platform,
            'title' => $idea->title,
            'hook' => $idea->hook,
            'description' => '',
            'tags' => [],
            'hashtags' => [],
        ]);

        $content = SocialContent::create([
            'social_account_id' => $socialAccountId,
            'platform' => $idea->platform,
            'content_type' => $idea->platform === 'youtube' ? 'video' : 'reel',
            'title' => $idea->title,
            'hook' => $idea->hook,
            'status' => 'draft',
            'seo_score' => $scored['seo_score'],
            'seo_breakdown' => $scored['seo_breakdown'],
        ]);

        $idea->update(['status' => 'converted']);

        return $content;
    }

    /**
     * Analyze historical post performance by day-of-week and hour-of-day across matching channels.
     */
    public function getBestPostingTimes(?int $brandId = null, ?int $accountId = null, ?string $platform = null): array
    {
        $accountsQuery = SocialAccount::query();
        if ($brandId) {
            $accountsQuery->where('social_brand_id', $brandId);
        }
        if ($accountId) {
            $accountsQuery->where('id', $accountId);
        }
        if ($platform && in_array($platform, SocialAccount::PLATFORMS, true)) {
            $accountsQuery->where('platform', $platform);
        }

        $accounts = $accountsQuery->get();
        if ($accounts->isEmpty()) {
            return [
                'source' => 'none',
                'sample_size' => 0,
                'top_slots' => [],
                'by_day' => [],
                'by_hour' => [],
            ];
        }

        $samples = [];
        $seen = [];

        foreach ($accounts as $acc) {
            $recent = $acc->analytics_cache['recent_videos'] ?? [];
            foreach ($recent as $v) {
                $pub = $v['published_at'] ?? null;
                if (! $pub) {
                    continue;
                }
                $key = $acc->id.':'.($v['id'] ?? $pub);
                if (isset($seen[$key])) {
                    continue;
                }
                $seen[$key] = true;
                $samples[] = [
                    'published_at' => $pub,
                    'views' => (int) ($v['views'] ?? 0),
                    'engagement' => (int) ($v['likes'] ?? 0) + (int) ($v['comments'] ?? 0) * 2,
                ];
            }
        }

        $publishedContents = SocialContent::whereIn('social_account_id', $accounts->pluck('id'))
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->get(['id', 'social_account_id', 'youtube_video_id', 'instagram_media_id', 'published_at', 'views_count', 'likes_count', 'comments_count']);

        foreach ($publishedContents as $c) {
            $extId = $c->youtube_video_id ?: ($c->instagram_media_id ?: 'content_'.$c->id);
            $key = $c->social_account_id.':'.$extId;
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $samples[] = [
                'published_at' => $c->published_at->toIso8601String(),
                'views' => (int) $c->views_count,
                'engagement' => (int) $c->likes_count + (int) $c->comments_count * 2,
            ];
        }

        if (empty($samples)) {
            $fallbackSlots = [];
            foreach ($accounts as $acc) {
                $strat = $acc->resolvedGrowthStrategy();
                foreach ((array) ($strat['best_times'] ?? []) as $time) {
                    $fallbackSlots[] = [
                        'day_index' => null,
                        'day' => 'Any',
                        'hour' => (int) substr((string) $time, 0, 2),
                        'time_label' => (string) $time,
                        'label' => strtoupper($acc->platform)." {$time}",
                        'avg_views' => 0,
                        'sample_size' => 0,
                    ];
                }
            }

            return [
                'source' => 'strategy_default',
                'sample_size' => 0,
                'top_slots' => array_slice($fallbackSlots, 0, 5),
                'by_day' => [],
                'by_hour' => [],
            ];
        }

        $displayTimezone = 'Asia/Kolkata';
        $dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        $byDay = [];
        $byHour = [];
        $bySlot = [];

        foreach ($samples as $s) {
            try {
                $dt = Carbon::parse($s['published_at'])->timezone($displayTimezone);
            } catch (\Throwable) {
                continue;
            }
            $dIdx = (int) $dt->dayOfWeek;
            $hr = (int) $dt->hour;
            $slotKey = "{$dIdx}_{$hr}";

            $byDay[$dIdx] ??= ['day_index' => $dIdx, 'day' => $dayNames[$dIdx], 'count' => 0, 'views' => 0, 'engagement' => 0];
            $byDay[$dIdx]['count']++;
            $byDay[$dIdx]['views'] += $s['views'];
            $byDay[$dIdx]['engagement'] += $s['engagement'];

            $byHour[$hr] ??= ['hour' => $hr, 'time_label' => sprintf('%02d:00', $hr), 'count' => 0, 'views' => 0, 'engagement' => 0];
            $byHour[$hr]['count']++;
            $byHour[$hr]['views'] += $s['views'];
            $byHour[$hr]['engagement'] += $s['engagement'];

            $bySlot[$slotKey] ??= ['day_index' => $dIdx, 'day' => $dayNames[$dIdx], 'hour' => $hr, 'time_label' => sprintf('%02d:00', $hr), 'count' => 0, 'views' => 0, 'engagement' => 0];
            $bySlot[$slotKey]['count']++;
            $bySlot[$slotKey]['views'] += $s['views'];
            $bySlot[$slotKey]['engagement'] += $s['engagement'];
        }

        $finalize = fn (array $row) => array_merge($row, [
            'avg_views' => $row['count'] > 0 ? (int) round($row['views'] / $row['count']) : 0,
            'avg_engagement' => $row['count'] > 0 ? (int) round($row['engagement'] / $row['count']) : 0,
            'sample_size' => $row['count'],
        ]);

        $dayStats = collect($byDay)->map($finalize)->sortByDesc('avg_views')->values()->all();
        $hourStats = collect($byHour)->map($finalize)->sortByDesc('avg_views')->values()->all();
        $topSlots = collect($bySlot)->map(function ($row) use ($finalize) {
            $f = $finalize($row);
            $f['label'] = "{$f['day']} {$f['time_label']}";
            return $f;
        })->sortByDesc('avg_views')->take(5)->values()->all();

        return [
            'source' => 'historical_analytics',
            'timezone' => $displayTimezone,
            'sample_size' => count($samples),
            'top_slots' => $topSlots,
            'by_day' => $dayStats,
            'by_hour' => $hourStats,
        ];
    }
}
