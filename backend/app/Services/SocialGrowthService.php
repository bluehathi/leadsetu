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
        $title = trim((string) ($data['title'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        $hook = trim((string) ($data['hook'] ?? ''));
        $keyword = mb_strtolower(trim((string) ($data['target_keyword'] ?? '')));
        $tags = array_values(array_filter((array) ($data['tags'] ?? [])));
        $hashtags = array_values(array_filter((array) ($data['hashtags'] ?? [])));

        $checks = [];
        $score = 0;

        // 1. Title length & punchiness (20 pts)
        $titleLen = mb_strlen($title);
        $idealTitle = $platform === 'youtube' ? ($titleLen >= 35 && $titleLen <= 70) : ($titleLen >= 15 && $titleLen <= 60);
        $titlePts = $idealTitle ? 20 : ($titleLen >= 10 ? 10 : 0);
        $score += $titlePts;
        $checks[] = [
            'key' => 'title_length',
            'label' => $platform === 'youtube' ? 'Title length (35–70 chars)' : 'Hook/Title length (15–60 chars)',
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

        // 3. Description / Caption depth (20 pts)
        $descLen = mb_strlen($description);
        $goodDesc = $descLen >= 120;
        $descPts = $goodDesc ? 20 : ($descLen >= 40 ? 10 : 0);
        $score += $descPts;
        $checks[] = [
            'key' => 'description_depth',
            'label' => $platform === 'youtube' ? 'Description depth (120+ chars)' : 'Caption depth (120+ chars)',
            'passed' => $goodDesc,
            'points' => $descPts,
            'max' => 20,
        ];

        // 4. Tags / Hashtags volume (20 pts)
        $tagCount = $platform === 'youtube' ? count($tags) : count($hashtags);
        $goodTags = $platform === 'youtube' ? ($tagCount >= 5) : ($tagCount >= 5 && $tagCount <= 15);
        $tagPts = $goodTags ? 20 : ($tagCount >= 2 ? 10 : 0);
        $score += $tagPts;
        $checks[] = [
            'key' => 'tags_count',
            'label' => $platform === 'youtube' ? 'At least 5 relevant tags' : '5–15 targeted hashtags',
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
}
