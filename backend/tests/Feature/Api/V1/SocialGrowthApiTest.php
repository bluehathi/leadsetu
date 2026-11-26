<?php

namespace Tests\Feature\Api\V1;

use App\Models\SocialAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\InteractsWithTenants;
use Tests\TestCase;

class SocialGrowthApiTest extends TestCase
{
    use RefreshDatabase, InteractsWithTenants;

    private const PERMS = [
        'view_social_accounts',
        'manage_social_accounts',
        'manage_social_content',
        'use_growth_tools',
    ];

    public function test_unauthenticated_and_unauthorized_users_are_rejected(): void
    {
        $this->getJson('/api/v1/social/overview')->assertUnauthorized();

        $user = $this->tenantUser([]);
        $this->actingAs($user, 'sanctum');
        $this->getJson('/api/v1/social/overview')->assertForbidden();
        $this->getJson('/api/v1/social/accounts')->assertForbidden();
        $this->postJson('/api/v1/social/accounts', [])->assertForbidden();
    }

    public function test_can_manage_multiple_youtube_and_instagram_accounts_with_workspace_isolation(): void
    {
        $user = $this->tenantUser(self::PERMS);
        $other = $this->tenantUser(self::PERMS);

        $this->actingAs($user, 'sanctum');

        // Create 2 YouTube accounts and 1 Instagram account
        $yt1 = $this->postJson('/api/v1/social/accounts', [
            'platform' => 'youtube',
            'account_name' => 'LeadSetu Tech',
            'handle' => '@leadsetutech',
            'niche' => 'SaaS',
            'followers_count' => 12500,
            'views_count' => 250000,
            'engagement_rate' => 4.5,
        ])->assertCreated()->json('data');

        $this->postJson('/api/v1/social/accounts', [
            'platform' => 'youtube',
            'account_name' => 'LeadSetu Shorts',
            'handle' => '@leadsetushorts',
            'followers_count' => 5000,
            'views_count' => 90000,
        ])->assertCreated();

        $ig1 = $this->postJson('/api/v1/social/accounts', [
            'platform' => 'instagram',
            'account_name' => 'LeadSetu Official',
            'handle' => '@leadsetu.ig',
            'niche' => 'Marketing',
            'followers_count' => 18000,
            'views_count' => 400000,
        ])->assertCreated()->json('data');

        // Sync account
        $this->postJson("/api/v1/social/accounts/{$yt1['id']}/sync")
            ->assertOk()
            ->assertJsonPath('data.status', 'connected');

        // Overview aggregates all 3 accounts
        $this->getJson('/api/v1/social/overview')
            ->assertOk()
            ->assertJsonPath('data.totals.accounts', 3)
            ->assertJsonPath('data.totals.youtube_accounts', 2)
            ->assertJsonPath('data.totals.instagram_accounts', 1)
            ->assertJsonPath('data.totals.followers', 35500);

        // Filter by instagram
        $this->getJson('/api/v1/social/accounts?platform=instagram')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ig1['id']);

        // Other workspace cannot see or access these accounts
        $this->actingAs($other, 'sanctum');
        $this->getJson('/api/v1/social/accounts')
            ->assertOk()
            ->assertJsonCount(0, 'data');
        $this->getJson("/api/v1/social/accounts/{$yt1['id']}")->assertNotFound();
    }

    public function test_content_seo_scoring_and_ai_optimize_workflow(): void
    {
        $user = $this->tenantUser(self::PERMS);
        $this->actingAs($user, 'sanctum');

        $account = SocialAccount::create([
            'platform' => 'youtube',
            'account_name' => 'Creator Lab',
            'handle' => '@creatorlab',
            'niche' => 'YouTube SEO',
        ]);
        $account->workspace_id = $user->workspace_id;
        $account->save();

        // AI Optimize preview
        $opt = $this->postJson('/api/v1/social/contents/optimize', [
            'platform' => 'youtube',
            'topic' => 'YouTube SEO Checklist',
            'target_keyword' => 'youtube seo',
            'niche' => 'Creator Growth',
        ])->assertOk()->json('data');

        $this->assertGreaterThanOrEqual(80, $opt['seo_score']);
        $this->assertCount(3, $opt['suggested_titles']);

        // Save optimized content
        $content = $this->postJson('/api/v1/social/contents', [
            'social_account_id' => $account->id,
            'platform' => 'youtube',
            'content_type' => 'video',
            'title' => $opt['recommended_title'],
            'target_keyword' => 'youtube seo',
            'hook' => $opt['hook'],
            'description' => $opt['description'],
            'tags' => $opt['tags'],
            'hashtags' => $opt['hashtags'],
            'status' => 'scheduled',
        ])->assertCreated()->json('data');

        $this->assertGreaterThanOrEqual(80, $content['seo_score']);
        $this->assertCount(5, $content['seo_breakdown']);
    }

    public function test_keywords_competitors_and_daily_ideas_conversion(): void
    {
        $user = $this->tenantUser(self::PERMS);
        $this->actingAs($user, 'sanctum');

        $ig = $this->postJson('/api/v1/social/accounts', [
            'platform' => 'instagram',
            'account_name' => 'Brand IG',
            'handle' => '@brandig',
            'niche' => 'Reels Growth',
        ])->assertCreated()->json('data');

        // Keyword research
        $this->postJson('/api/v1/social/keywords/analyze', [
            'keyword' => 'instagram reels hooks',
            'platform' => 'instagram',
            'social_account_id' => $ig['id'],
        ])->assertCreated()
            ->assertJsonPath('data.keyword', 'instagram reels hooks');

        $this->getJson('/api/v1/social/keywords')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // Competitor tracking
        $this->postJson('/api/v1/social/competitors', [
            'social_account_id' => $ig['id'],
            'platform' => 'instagram',
            'channel_name' => 'Rival Studio',
            'handle' => '@rivalstudio',
            'followers_count' => 50000,
            'avg_views' => 18000,
            'top_video_title' => '3 Hooks That Went Viral',
        ])->assertCreated();

        $this->getJson('/api/v1/social/competitors')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // Daily ideas generation & convert to draft
        $ideas = $this->postJson('/api/v1/social/ideas/generate', [
            'social_account_id' => $ig['id'],
        ])->assertCreated()->json('data');

        $this->assertCount(3, $ideas);

        $this->postJson("/api/v1/social/ideas/{$ideas[0]['id']}/convert", [
            'social_account_id' => $ig['id'],
        ])->assertCreated()
            ->assertJsonPath('data.platform', 'instagram')
            ->assertJsonPath('data.content_type', 'reel')
            ->assertJsonPath('data.status', 'draft');
    }

    public function test_youtube_and_instagram_oauth_connect_and_auto_sync(): void
    {
        config([
            'services.youtube.client_id' => 'yt-client-id',
            'services.youtube.client_secret' => 'yt-secret',
            'services.youtube.redirect' => 'http://localhost:8000/api/v1/social/oauth/youtube/callback',
            'services.instagram.client_id' => 'ig-client-id',
            'services.instagram.client_secret' => 'ig-secret',
            'services.instagram.redirect' => 'http://localhost:8000/api/v1/social/oauth/instagram/callback',
        ]);

        $user = $this->tenantUser(self::PERMS);
        $this->actingAs($user, 'sanctum');

        $ytAuthUrl = $this->getJson('/api/v1/social/oauth/youtube/url')
            ->assertOk()
            ->json('data.url');
        parse_str(parse_url($ytAuthUrl, PHP_URL_QUERY), $ytQuery);

        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response([
                'access_token' => 'yt-access-1',
                'refresh_token' => 'yt-refresh-1',
                'expires_in' => 3600,
            ]),
            'https://www.googleapis.com/youtube/v3/channels*' => Http::sequence()
                ->push([
                    'items' => [[
                        'id' => 'UC123',
                        'snippet' => ['title' => 'LeadSetu YT', 'customUrl' => '@leadsetuyt'],
                        'statistics' => ['subscriberCount' => '15000', 'viewCount' => '320000', 'videoCount' => '45'],
                    ]],
                ])
                ->push([
                    'items' => [[
                        'id' => 'UC123',
                        'snippet' => ['title' => 'LeadSetu YT', 'customUrl' => '@leadsetuyt'],
                        'statistics' => ['subscriberCount' => '16200', 'viewCount' => '350000', 'videoCount' => '48'],
                    ]],
                ])
                ->push([
                    'items' => [[
                        'id' => 'UC123',
                        'snippet' => ['title' => 'LeadSetu YT', 'customUrl' => '@leadsetuyt'],
                        'statistics' => ['subscriberCount' => '16300', 'viewCount' => '351000', 'videoCount' => '48'],
                    ]],
                ]),
        ]);

        $this->get('/api/v1/social/oauth/youtube/callback?code=authcode&state='.urlencode($ytQuery['state']))
            ->assertRedirect();

        $account = SocialAccount::where('external_id', 'UC123')->firstOrFail();
        $this->assertSame(15000, $account->followers_count);
        $this->assertSame('yt-access-1', $account->access_token);

        // Run scheduled sync command and verify updated metrics
        $this->artisan('social:sync')->assertExitCode(0);

        $account->refresh();
        $this->assertSame(16200, $account->followers_count);
        $this->assertSame(350000, $account->views_count);
        $this->assertSame(48, $account->posts_count);

        // Sync-all endpoint works for authenticated workspace user
        $this->postJson('/api/v1/social/accounts/sync-all')->assertOk();
    }
}
