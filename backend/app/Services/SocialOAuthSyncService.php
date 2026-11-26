<?php

namespace App\Services;

use App\Models\SocialAccount;
use App\Models\SocialVideoAnalytic;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class SocialOAuthSyncService
{
    public function getAuthUrl(string $platform, User $user): string
    {
        if (! in_array($platform, SocialAccount::PLATFORMS, true)) {
            throw new RuntimeException("Unsupported platform: {$platform}");
        }

        $state = Crypt::encryptString(json_encode([
            'user_id' => $user->id,
            'workspace_id' => $user->workspace_id,
            'platform' => $platform,
            'issued_at' => now()->timestamp,
        ]));

        if ($platform === 'youtube') {
            $clientId = config('services.youtube.client_id');
            $redirect = config('services.youtube.redirect') ?: url('/api/v1/social/oauth/youtube/callback');
            if (! $clientId) {
                throw new RuntimeException('YOUTUBE_CLIENT_ID is not configured in backend .env.');
            }

            return 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
                'client_id' => $clientId,
                'redirect_uri' => $redirect,
                'response_type' => 'code',
                'scope' => 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.upload',
                'access_type' => 'offline',
                'prompt' => 'consent',
                'state' => $state,
            ]);
        }

        $clientId = config('services.instagram.client_id');
        $redirect = config('services.instagram.redirect') ?: url('/api/v1/social/oauth/instagram/callback');
        $version = config('services.instagram.graph_version', 'v21.0');
        if (! $clientId) {
            throw new RuntimeException('INSTAGRAM_CLIENT_ID is not configured in backend .env.');
        }

        $scopes = $platform === 'facebook'
            ? 'pages_show_list,pages_read_engagement,pages_manage_posts,business_management'
            : 'instagram_basic,pages_show_list,pages_read_engagement,instagram_manage_insights,instagram_content_publish,business_management';

        return "https://www.facebook.com/{$version}/dialog/oauth?".http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirect,
            'response_type' => 'code',
            'scope' => $scopes,
            'auth_type' => 'rerequest',
            'state' => $state,
        ]);
    }

    /**
     * Handle OAuth callback, exchange code for tokens, and connect all discovered YT/IG/FB accounts.
     *
     * @return SocialAccount[]
     */
    public function handleCallback(string $platform, string $code, string $encryptedState): array
    {
        $payload = json_decode(Crypt::decryptString($encryptedState), true);
        $targetPlatform = $payload['platform'] ?? null;
        if (! is_array($payload) || ! in_array($targetPlatform, SocialAccount::PLATFORMS, true)) {
            throw new RuntimeException('Invalid OAuth state.');
        }

        $workspaceId = (int) $payload['workspace_id'];
        $userId = (int) $payload['user_id'];

        return match ($targetPlatform) {
            'youtube' => $this->connectYouTube($code, $workspaceId, $userId),
            'facebook' => $this->connectFacebook($code, $workspaceId, $userId),
            default => $this->connectInstagram($code, $workspaceId, $userId),
        };
    }

    protected function connectYouTube(string $code, int $workspaceId, int $userId): array
    {
        $redirect = config('services.youtube.redirect') ?: url('/api/v1/social/oauth/youtube/callback');
        $tokenResp = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.youtube.client_id'),
            'client_secret' => config('services.youtube.client_secret'),
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $redirect,
        ]);

        if (! $tokenResp->successful()) {
            throw new RuntimeException('Failed to exchange YouTube OAuth code.');
        }

        $tokens = $tokenResp->json();
        $accessToken = $tokens['access_token'] ?? null;
        $refreshToken = $tokens['refresh_token'] ?? null;
        $expiresAt = isset($tokens['expires_in']) ? now()->addSeconds((int) $tokens['expires_in']) : null;

        $channelsResp = Http::withToken($accessToken)->get('https://www.googleapis.com/youtube/v3/channels', [
            'part' => 'snippet,statistics',
            'mine' => 'true',
        ]);

        if (! $channelsResp->successful()) {
            throw new RuntimeException('Failed to fetch YouTube channels.');
        }

        $connected = [];
        foreach ($channelsResp->json('items', []) as $item) {
            $snippet = $item['snippet'] ?? [];
            $stats = $item['statistics'] ?? [];
            $handle = $snippet['customUrl'] ?? '@'.str_replace(' ', '', strtolower($snippet['title'] ?? 'channel'));

            $account = $this->upsertConnectedAccount($workspaceId, $userId, 'youtube', $item['id'], [
                'account_name' => $snippet['title'] ?? 'YouTube Channel',
                'handle' => str_starts_with($handle, '@') ? $handle : "@{$handle}",
                'avatar_url' => $snippet['thumbnails']['default']['url'] ?? null,
                'followers_count' => (int) ($stats['subscriberCount'] ?? 0),
                'views_count' => (int) ($stats['viewCount'] ?? 0),
                'posts_count' => (int) ($stats['videoCount'] ?? 0),
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken ?: SocialAccount::withoutGlobalScopes()
                    ->where('workspace_id', $workspaceId)
                    ->where('platform', 'youtube')
                    ->where('external_id', $item['id'])
                    ->value('refresh_token'),
                'token_expires_at' => $expiresAt,
                'status' => 'connected',
                'last_synced_at' => now(),
                'analytics_cache' => null,
                'analytics_synced_at' => null,
            ]);

            $connected[] = $account;
        }

        return $connected;
    }

    protected function connectInstagram(string $code, int $workspaceId, int $userId): array
    {
        $version = config('services.instagram.graph_version', 'v21.0');
        $redirect = config('services.instagram.redirect') ?: url('/api/v1/social/oauth/instagram/callback');

        $tokenResp = Http::get("https://graph.facebook.com/{$version}/oauth/access_token", [
            'client_id' => config('services.instagram.client_id'),
            'client_secret' => config('services.instagram.client_secret'),
            'redirect_uri' => $redirect,
            'code' => $code,
        ]);

        if (! $tokenResp->successful()) {
            throw new RuntimeException('Failed to exchange Instagram OAuth code.');
        }

        $shortToken = $tokenResp->json('access_token');

        // Exchange for long-lived token (60 days)
        $longResp = Http::get("https://graph.facebook.com/{$version}/oauth/access_token", [
            'grant_type' => 'fb_exchange_token',
            'client_id' => config('services.instagram.client_id'),
            'client_secret' => config('services.instagram.client_secret'),
            'fb_exchange_token' => $shortToken,
        ]);

        $accessToken = $longResp->successful() ? ($longResp->json('access_token') ?: $shortToken) : $shortToken;
        $expiresIn = $longResp->successful() ? $longResp->json('expires_in') : $tokenResp->json('expires_in');
        $expiresAt = $expiresIn ? now()->addSeconds((int) $expiresIn) : now()->addDays(60);

        $pages = $this->fetchAllFacebookPages(
            $version,
            $accessToken,
            'id,name,instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count},connected_instagram_account{id,username,name,profile_picture_url,followers_count,media_count}'
        );

        if (count($pages) === 0) {
            throw new RuntimeException('Facebook returned 0 Pages. During Facebook Login, make sure you select the Facebook Page linked to your Instagram Business/Creator account.');
        }

        $connected = [];
        foreach ($pages as $page) {
            $ig = $page['instagram_business_account'] ?? ($page['connected_instagram_account'] ?? null);
            if (! $ig) {
                continue;
            }

            $username = $ig['username'] ?? 'instagram';
            $account = $this->upsertConnectedAccount($workspaceId, $userId, 'instagram', $ig['id'], [
                'account_name' => $ig['name'] ?? $username,
                'handle' => "@{$username}",
                'avatar_url' => $ig['profile_picture_url'] ?? null,
                'followers_count' => (int) ($ig['followers_count'] ?? 0),
                'posts_count' => (int) ($ig['media_count'] ?? 0),
                'access_token' => $accessToken,
                'token_expires_at' => $expiresAt,
                'status' => 'connected',
                'last_synced_at' => now(),
                'analytics_cache' => null,
                'analytics_synced_at' => null,
            ]);

            $connected[] = $this->syncInstagram($account);
        }

        if (count($connected) === 0) {
            throw new RuntimeException('Found '.count($pages).' Facebook Page(s), but none have an Instagram Business/Creator account linked.');
        }

        return $connected;
    }

    protected function connectFacebook(string $code, int $workspaceId, int $userId): array
    {
        $version = config('services.instagram.graph_version', 'v21.0');
        $redirect = config('services.instagram.redirect') ?: url('/api/v1/social/oauth/instagram/callback');

        $tokenResp = Http::get("https://graph.facebook.com/{$version}/oauth/access_token", [
            'client_id' => config('services.instagram.client_id'),
            'client_secret' => config('services.instagram.client_secret'),
            'redirect_uri' => $redirect,
            'code' => $code,
        ]);

        if (! $tokenResp->successful()) {
            throw new RuntimeException('Failed to exchange Facebook OAuth code.');
        }

        $shortToken = $tokenResp->json('access_token');
        $longResp = Http::get("https://graph.facebook.com/{$version}/oauth/access_token", [
            'grant_type' => 'fb_exchange_token',
            'client_id' => config('services.instagram.client_id'),
            'client_secret' => config('services.instagram.client_secret'),
            'fb_exchange_token' => $shortToken,
        ]);

        $userToken = $longResp->successful() ? ($longResp->json('access_token') ?: $shortToken) : $shortToken;
        $expiresIn = $longResp->successful() ? $longResp->json('expires_in') : $tokenResp->json('expires_in');
        $expiresAt = $expiresIn ? now()->addSeconds((int) $expiresIn) : now()->addDays(60);

        $pages = $this->fetchAllFacebookPages(
            $version,
            $userToken,
            'id,name,username,fan_count,followers_count,picture{url},access_token'
        );

        if (count($pages) === 0) {
            throw new RuntimeException('Facebook returned 0 Pages. Make sure you select at least one Facebook Page during login.');
        }

        $connected = [];
        foreach ($pages as $page) {
            $handle = ! empty($page['username']) ? '@'.$page['username'] : '@fb-'.$page['id'];
            $followers = (int) ($page['followers_count'] ?? ($page['fan_count'] ?? 0));

            $account = $this->upsertConnectedAccount($workspaceId, $userId, 'facebook', $page['id'], [
                'account_name' => $page['name'] ?? 'Facebook Page',
                'handle' => $handle,
                'avatar_url' => $page['picture']['data']['url'] ?? null,
                'followers_count' => $followers,
                'access_token' => $page['access_token'] ?? $userToken,
                'token_expires_at' => $expiresAt,
                'status' => 'connected',
                'last_synced_at' => now(),
            ]);

            $connected[] = $this->syncFacebook($account);
        }

        return $connected;
    }

    /**
     * Collect Facebook Pages from both /me/accounts and Meta Business Portfolios (/me/businesses).
     */
    protected function fetchAllFacebookPages(string $version, string $userToken, string $fields): array
    {
        $pagesById = [];

        $accountsResp = Http::get("https://graph.facebook.com/{$version}/me/accounts", [
            'fields' => $fields,
            'limit' => 100,
            'access_token' => $userToken,
        ]);

        if (! $accountsResp->successful()) {
            throw new RuntimeException('Failed to fetch Facebook Pages: '.($accountsResp->json('error.message') ?: $accountsResp->status()));
        }

        foreach ($accountsResp->json('data', []) as $page) {
            if (! empty($page['id'])) {
                $pagesById[$page['id']] = $page;
            }
        }

        // Also query Business Portfolio owned/client pages when business_management is granted.
        $bizResp = Http::get("https://graph.facebook.com/{$version}/me/businesses", [
            'fields' => 'id,name',
            'limit' => 50,
            'access_token' => $userToken,
        ]);

        if ($bizResp->successful()) {
            foreach ($bizResp->json('data', []) as $biz) {
                if (empty($biz['id'])) {
                    continue;
                }
                foreach (['owned_pages', 'client_pages'] as $edge) {
                    $edgeResp = Http::get("https://graph.facebook.com/{$version}/{$biz['id']}/{$edge}", [
                        'fields' => $fields,
                        'limit' => 100,
                        'access_token' => $userToken,
                    ]);
                    if ($edgeResp->successful()) {
                        foreach ($edgeResp->json('data', []) as $page) {
                            if (! empty($page['id']) && ! isset($pagesById[$page['id']])) {
                                $pagesById[$page['id']] = $page;
                            }
                        }
                    }
                }
            }
        }

        return array_values($pagesById);
    }

    /**
     * Create or update a connected social account with explicit tenant/user ownership
     * (OAuth callbacks have no authenticated session for BelongsToWorkspace).
     */
    protected function upsertConnectedAccount(
        int $workspaceId,
        int $userId,
        string $platform,
        string $externalId,
        array $attributes
    ): SocialAccount {
        $account = SocialAccount::withoutGlobalScopes()->firstOrNew([
            'workspace_id' => $workspaceId,
            'platform' => $platform,
            'external_id' => $externalId,
        ]);

        $account->forceFill(array_merge($attributes, [
            'workspace_id' => $workspaceId,
            'user_id' => $userId,
            'platform' => $platform,
            'external_id' => $externalId,
        ]));
        $account->save();

        return $account;
    }

    public function syncAccount(SocialAccount $account): SocialAccount
    {
        if (! $account->access_token) {
            $account->forceFill([
                'last_synced_at' => Carbon::now(),
                'status' => $account->status === 'disconnected' ? 'connected' : $account->status,
            ])->save();

            return $account->fresh();
        }

        $synced = match ($account->platform) {
            'youtube' => $this->syncYouTube($account),
            'facebook' => $this->syncFacebook($account),
            default => $this->syncInstagram($account),
        };

        if ($synced->access_token && $synced->status === 'connected') {
            $this->getChannelAnalytics($synced, true);
        }

        return $synced->fresh();
    }

    public function getFreshYouTubeToken(SocialAccount $account): ?string
    {
        return $this->ensureFreshYouTubeToken($account);
    }

    protected function ensureFreshYouTubeToken(SocialAccount $account): ?string
    {
        $accessToken = $account->access_token;
        if (! $accessToken) {
            return null;
        }

        if ($account->token_expires_at && $account->token_expires_at->isPast() && $account->refresh_token) {
            $refreshResp = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'client_id' => config('services.youtube.client_id'),
                'client_secret' => config('services.youtube.client_secret'),
                'refresh_token' => $account->refresh_token,
                'grant_type' => 'refresh_token',
            ]);

            if (! $refreshResp->successful()) {
                $account->update(['status' => 'needs_reauth']);
                return null;
            }

            $accessToken = $refreshResp->json('access_token');
            $account->access_token = $accessToken;
            if ($expiresIn = $refreshResp->json('expires_in')) {
                $account->token_expires_at = now()->addSeconds((int) $expiresIn);
            }
            $account->save();
        }

        return $accessToken;
    }

    /**
     * Get per-channel analytics from DB cache, or fetch live from YT/IG on first load or explicit refresh.
     */
    public function getChannelAnalytics(SocialAccount $account, bool $forceRefresh = false): array
    {
        $contents = $account->contents()->get(['id', 'status', 'seo_score']);
        $studioStats = [
            'planned_contents' => $contents->count(),
            'published_contents' => $contents->where('status', 'published')->count(),
            'avg_seo_score' => $contents->count() > 0 ? round((float) $contents->avg('seo_score'), 1) : 0,
        ];

        if (! $forceRefresh && is_array($account->analytics_cache)) {
            return array_merge($account->analytics_cache, [
                'account' => $account,
                'studio' => $studioStats,
                'source' => 'cache',
                'synced_at' => $account->analytics_synced_at?->toIso8601String(),
                'warning' => null,
            ]);
        }

        $base = [
            'account' => $account,
            'studio' => $studioStats,
            'source' => 'cached',
            'synced_at' => $account->analytics_synced_at?->toIso8601String(),
            'channel_meta' => null,
            'summary' => [
                'followers_count' => $account->followers_count,
                'views_count' => $account->views_count,
                'posts_count' => $account->posts_count,
                'engagement_rate' => $account->engagement_rate,
                'recent_videos_count' => 0,
                'recent_total_views' => 0,
                'recent_total_likes' => 0,
                'recent_total_comments' => 0,
                'avg_views_per_video' => 0,
                'shorts_count' => 0,
                'long_form_count' => 0,
            ],
            'top_items' => [],
            'recent_items' => [],
            'warning' => null,
        ];

        if (! $account->access_token) {
            $base['warning'] = 'Connect via OAuth to load live video-level analytics.';
            return $base;
        }

        $result = match ($account->platform) {
            'youtube' => $this->getYouTubeAnalytics($account, $base),
            'facebook' => $this->getFacebookAnalytics($account, $base),
            default => $this->getInstagramAnalytics($account, $base),
        };

        if ($result['source'] === 'live') {
            $now = now();
            $account->forceFill([
                'followers_count' => $result['summary']['followers_count'],
                'views_count' => $result['summary']['views_count'],
                'posts_count' => $result['summary']['posts_count'],
                'engagement_rate' => $result['summary']['engagement_rate'],
                'last_synced_at' => $now,
                'analytics_cache' => [
                    'channel_meta' => $result['channel_meta'],
                    'summary' => $result['summary'],
                    'top_items' => $result['top_items'],
                    'recent_items' => $result['recent_items'],
                    'deep_analytics' => $result['deep_analytics'] ?? null,
                ],
                'analytics_synced_at' => $now,
            ])->save();

            $result['synced_at'] = $now->toIso8601String();
            $result['account'] = $account->fresh();
        }

        return $result;
    }

    protected function getYouTubeAnalytics(SocialAccount $account, array $base): array
    {
        $accessToken = $this->ensureFreshYouTubeToken($account);
        if (! $accessToken) {
            $base['warning'] = 'YouTube token expired. Please reconnect your channel.';
            return $base;
        }

        $channelParams = ['part' => 'snippet,statistics,contentDetails'];
        if ($account->external_id) {
            $channelParams['id'] = $account->external_id;
        } else {
            $channelParams['mine'] = 'true';
        }

        $channelResp = Http::withToken($accessToken)->get('https://www.googleapis.com/youtube/v3/channels', $channelParams);
        if ($channelResp->status() === 401) {
            $account->update(['status' => 'needs_reauth']);
            $base['warning'] = 'YouTube authorization expired. Please reconnect your channel.';
            return $base;
        }

        $channel = $channelResp->successful() ? $channelResp->json('items.0') : null;
        if (! $channel) {
            $base['warning'] = 'Unable to fetch live channel details from YouTube.';
            return $base;
        }

        $snippet = $channel['snippet'] ?? [];
        $stats = $channel['statistics'] ?? [];
        $uploadsPlaylistId = $channel['contentDetails']['relatedPlaylists']['uploads'] ?? null;

        $base['source'] = 'live';
        $base['channel_meta'] = [
            'country' => $snippet['country'] ?? null,
            'published_at' => $snippet['publishedAt'] ?? null,
            'description' => $snippet['description'] ?? null,
            'channel_url' => $account->external_id ? "https://www.youtube.com/channel/{$account->external_id}" : null,
        ];
        $base['summary']['followers_count'] = (int) ($stats['subscriberCount'] ?? $account->followers_count);
        $base['summary']['views_count'] = (int) ($stats['viewCount'] ?? $account->views_count);
        $base['summary']['posts_count'] = (int) ($stats['videoCount'] ?? $account->posts_count);

        $items = [];
        if ($uploadsPlaylistId) {
            $videoIds = [];
            $pageToken = null;
            for ($page = 0; $page < 2; $page++) {
                $playlistParams = [
                    'part' => 'contentDetails',
                    'playlistId' => $uploadsPlaylistId,
                    'maxResults' => 50,
                ];
                if ($pageToken) {
                    $playlistParams['pageToken'] = $pageToken;
                }

                $playlistResp = Http::withToken($accessToken)->get('https://www.googleapis.com/youtube/v3/playlistItems', $playlistParams);
                if (! $playlistResp->successful()) {
                    break;
                }

                foreach ($playlistResp->json('items', []) as $plItem) {
                    if ($vid = $plItem['contentDetails']['videoId'] ?? null) {
                        $videoIds[] = $vid;
                    }
                }

                $pageToken = $playlistResp->json('nextPageToken');
                if (! $pageToken) {
                    break;
                }
            }

            foreach (array_chunk(array_unique($videoIds), 50) as $chunk) {
                $videosResp = Http::withToken($accessToken)->get('https://www.googleapis.com/youtube/v3/videos', [
                    'part' => 'snippet,statistics,contentDetails',
                    'id' => implode(',', $chunk),
                ]);

                foreach ($videosResp->json('items', []) as $video) {
                    $vSnippet = $video['snippet'] ?? [];
                    $vStats = $video['statistics'] ?? [];
                    $durationSec = $this->parseIsoDurationSeconds((string) ($video['contentDetails']['duration'] ?? ''));
                    $views = (int) ($vStats['viewCount'] ?? 0);
                    $likes = (int) ($vStats['likeCount'] ?? 0);
                    $comments = (int) ($vStats['commentCount'] ?? 0);
                    $title = $vSnippet['title'] ?? 'Untitled';
                    $isShort = ($durationSec > 0 && $durationSec <= 60) || str_contains(strtolower($title), '#short');

                    $items[] = [
                        'id' => $video['id'],
                        'title' => $title,
                        'thumbnail_url' => $vSnippet['thumbnails']['medium']['url'] ?? ($vSnippet['thumbnails']['default']['url'] ?? null),
                        'published_at' => $vSnippet['publishedAt'] ?? null,
                        'duration_seconds' => $durationSec,
                        'type' => $isShort ? 'short' : 'video',
                        'views' => $views,
                        'likes' => $likes,
                        'comments' => $comments,
                        'engagement_rate' => $views > 0 ? round((($likes + $comments) / $views) * 100, 2) : 0,
                        'url' => "https://www.youtube.com/watch?v={$video['id']}",
                    ];
                }
            }
        }

        $count = count($items);
        $totalViews = max(array_sum(array_column($items, 'views')), array_sum($videoViewsById));
        $totalLikes = array_sum(array_column($items, 'likes'));
        $totalComments = array_sum(array_column($items, 'comments'));
        $shortsCount = count(array_filter($items, fn ($i) => $i['type'] === 'short'));

        $base['summary']['recent_videos_count'] = $count;
        $base['summary']['recent_total_views'] = $totalViews;
        $base['summary']['recent_total_likes'] = $totalLikes;
        $base['summary']['recent_total_comments'] = $totalComments;
        $base['summary']['avg_views_per_video'] = $count > 0 ? (int) round($totalViews / $count) : 0;
        $base['summary']['engagement_rate'] = $totalViews > 0 ? round((($totalLikes + $totalComments) / $totalViews) * 100, 2) : $account->engagement_rate;
        $base['summary']['shorts_count'] = $shortsCount;
        $base['summary']['long_form_count'] = $count - $shortsCount;

        $sortedByViews = $items;
        usort($sortedByViews, fn ($a, $b) => $b['views'] <=> $a['views']);
        $base['top_items'] = array_slice($sortedByViews, 0, 5);
        $base['recent_items'] = $items;
        $base['deep_analytics'] = $this->fetchYouTubeDeepAnalytics($accessToken);

        return $base;
    }

    /**
     * Query YouTube Analytics API v2 for 28-day daily trends, watch time, and traffic sources.
     * Gracefully returns enabled=false when the token lacks yt-analytics.readonly scope.
     */
    protected function fetchYouTubeDeepAnalytics(string $accessToken, ?string $videoId = null): array
    {
        $endDate = now()->toDateString();
        $startDate = now()->subDays(27)->toDateString();

        $dailyParams = [
            'ids' => 'channel==MINE',
            'startDate' => $startDate,
            'endDate' => $endDate,
            'dimensions' => 'day',
            'metrics' => $videoId
                ? 'views,estimatedMinutesWatched,averageViewDuration,likes,comments'
                : 'views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost',
            'sort' => 'day',
        ];
        if ($videoId) {
            $dailyParams['filters'] = "video=={$videoId}";
        }

        $dailyResp = Http::withToken($accessToken)->get('https://youtubeanalytics.googleapis.com/v2/reports', $dailyParams);

        if ($dailyResp->status() === 401 || $dailyResp->status() === 403) {
            $apiReason = $dailyResp->json('error.errors.0.reason');
            $reason = $apiReason === 'accessNotConfigured'
                ? ($dailyResp->json('error.message') ?: 'YouTube Analytics API is disabled in your Google Cloud project.')
                : 'Reconnect your YouTube channel to grant YouTube Analytics permission (Watch Time, Daily Trends & Traffic Sources).';

            return [
                'enabled' => false,
                'reason' => $reason,
                'daily' => [],
                'totals' => null,
                'traffic_sources' => [],
            ];
        }

        if (! $dailyResp->successful()) {
            return [
                'enabled' => false,
                'reason' => 'YouTube Analytics data is temporarily unavailable.',
                'daily' => [],
                'totals' => null,
                'traffic_sources' => [],
            ];
        }

        $dailyRows = [];
        $sumViews = 0;
        $sumMinutes = 0;
        $avgDurSum = 0;
        $avgDurCount = 0;
        $subsGained = 0;
        $subsLost = 0;

        foreach ($dailyResp->json('rows', []) as $row) {
            $views = (int) ($row[1] ?? 0);
            $mins = (int) ($row[2] ?? 0);
            $avgDur = (int) ($row[3] ?? 0);
            $sumViews += $views;
            $sumMinutes += $mins;
            if ($avgDur > 0) {
                $avgDurSum += $avgDur;
                $avgDurCount++;
            }
            if (! $videoId) {
                $subsGained += (int) ($row[4] ?? 0);
                $subsLost += (int) ($row[5] ?? 0);
            }

            $dailyRows[] = [
                'date' => (string) ($row[0] ?? ''),
                'views' => $views,
                'watch_minutes' => $mins,
                'avg_view_duration' => $avgDur,
            ];
        }

        $trafficParams = [
            'ids' => 'channel==MINE',
            'startDate' => $startDate,
            'endDate' => $endDate,
            'dimensions' => 'insightTrafficSourceType',
            'metrics' => 'views,estimatedMinutesWatched',
            'sort' => '-views',
            'maxResults' => 8,
        ];
        if ($videoId) {
            $trafficParams['filters'] = "video=={$videoId}";
        }

        $trafficResp = Http::withToken($accessToken)->get('https://youtubeanalytics.googleapis.com/v2/reports', $trafficParams);
        $trafficSources = [];
        if ($trafficResp->successful()) {
            foreach ($trafficResp->json('rows', []) as $row) {
                $trafficSources[] = [
                    'source' => str_replace('_', ' ', strtolower((string) ($row[0] ?? 'other'))),
                    'views' => (int) ($row[1] ?? 0),
                    'watch_minutes' => (int) ($row[2] ?? 0),
                ];
            }
        }

        return [
            'enabled' => true,
            'period_days' => 28,
            'daily' => $dailyRows,
            'totals' => [
                'views' => $sumViews,
                'watch_hours' => round($sumMinutes / 60, 1),
                'watch_minutes' => $sumMinutes,
                'avg_view_duration_seconds' => $avgDurCount > 0 ? (int) round($avgDurSum / $avgDurCount) : 0,
                'subscribers_gained' => $subsGained,
                'subscribers_lost' => $subsLost,
                'net_subscribers' => $subsGained - $subsLost,
            ],
            'traffic_sources' => $trafficSources,
        ];
    }

    protected function getInstagramAnalytics(SocialAccount $account, array $base): array
    {
        if (! $account->external_id) {
            $base['warning'] = 'Instagram account ID is missing.';
            return $base;
        }

        $version = config('services.instagram.graph_version', 'v21.0');
        $mediaResp = Http::get("https://graph.facebook.com/{$version}/{$account->external_id}/media", [
            'fields' => 'id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count,insights.metric(views,reach)',
            'limit' => 25,
            'access_token' => $account->access_token,
        ]);

        if (! $mediaResp->successful()) {
            $mediaResp = Http::get("https://graph.facebook.com/{$version}/{$account->external_id}/media", [
                'fields' => 'id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count',
                'limit' => 25,
                'access_token' => $account->access_token,
            ]);
        }

        if (! $mediaResp->successful()) {
            $base['warning'] = 'Unable to fetch recent Instagram media. Token may need re-authentication.';
            return $base;
        }

        $base['source'] = 'live';
        $items = [];
        foreach ($mediaResp->json('data', []) as $post) {
            $likes = (int) ($post['like_count'] ?? 0);
            $comments = (int) ($post['comments_count'] ?? 0);
            $followers = max(1, (int) $account->followers_count);

            $insightMap = [];
            foreach ($post['insights']['data'] ?? [] as $m) {
                if (! empty($m['name'])) {
                    $insightMap[$m['name']] = (int) ($m['values'][0]['value'] ?? 0);
                }
            }
            $views = $insightMap['views'] ?? ($insightMap['plays'] ?? ($insightMap['reach'] ?? 0));

            $items[] = [
                'id' => $post['id'],
                'title' => mb_strimwidth((string) ($post['caption'] ?? 'Instagram Post'), 0, 80, '…'),
                'thumbnail_url' => $post['thumbnail_url'] ?? ($post['media_url'] ?? null),
                'published_at' => $post['timestamp'] ?? null,
                'duration_seconds' => null,
                'type' => strtolower((string) ($post['media_product_type'] ?? ($post['media_type'] ?? 'post'))),
                'views' => $views,
                'likes' => $likes,
                'comments' => $comments,
                'engagement_rate' => round((($likes + $comments) / max(1, $views ?: $followers)) * 100, 2),
                'url' => $post['permalink'] ?? null,
            ];
        }

        $totalViews = max(array_sum(array_column($items, 'views')), array_sum($videoViewsById));
        $count = count($items);
        $base['summary']['views_count'] = $totalViews;
        $base['summary']['recent_videos_count'] = $count;
        $base['summary']['recent_total_views'] = $totalViews;
        $base['summary']['recent_total_likes'] = array_sum(array_column($items, 'likes'));
        $base['summary']['recent_total_comments'] = array_sum(array_column($items, 'comments'));
        $base['summary']['avg_views_per_video'] = $count > 0 ? (int) round($totalViews / $count) : 0;
        $sortedByViews = $items;
        usort($sortedByViews, fn ($a, $b) => ($b['views'] ?: ($b['likes'] + $b['comments'])) <=> ($a['views'] ?: ($a['likes'] + $a['comments'])));
        $base['top_items'] = array_slice($sortedByViews, 0, 5);
        $base['recent_items'] = $items;

        return $base;
    }

    protected function parseIsoDurationSeconds(string $iso): int
    {
        if (! preg_match('/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/', $iso, $m)) {
            return 0;
        }

        return ((int) ($m[1] ?? 0) * 3600) + ((int) ($m[2] ?? 0) * 60) + (int) ($m[3] ?? 0);
    }

    /**
     * Get per-video / per-post analytics from DB cache for either YouTube or Instagram.
     */
    public function getMediaAnalytics(SocialAccount $account, string $mediaId, bool $forceRefresh = false): array
    {
        return match ($account->platform) {
            'instagram' => $this->getInstagramMediaAnalytics($account, $mediaId, $forceRefresh),
            'facebook' => $this->getFacebookPostAnalytics($account, $mediaId, $forceRefresh),
            default => $this->getYouTubeVideoAnalytics($account, $mediaId, $forceRefresh),
        };
    }

    protected function getFacebookAnalytics(SocialAccount $account, array $base): array
    {
        if (! $account->external_id) {
            $base['warning'] = 'Facebook Page ID is missing.';
            return $base;
        }

        $version = config('services.instagram.graph_version', 'v21.0');
        $pageResp = Http::get("https://graph.facebook.com/{$version}/{$account->external_id}", [
            'fields' => 'id,name,username,fan_count,followers_count,picture{url},link',
            'access_token' => $account->access_token,
        ]);

        if ($pageResp->status() === 401 || $pageResp->status() === 400) {
            $base['warning'] = 'Unable to fetch Facebook Page data. Token may need re-authentication.';
            return $base;
        }

        $pageData = $pageResp->successful() ? $pageResp->json() : [];
        $followers = (int) ($pageData['followers_count'] ?? ($pageData['fan_count'] ?? $account->followers_count));

        $postsResp = Http::get("https://graph.facebook.com/{$version}/{$account->external_id}/posts", [
            'fields' => 'id,message,story,created_time,permalink_url,full_picture,likes.summary(true),comments.summary(true),shares,attachments{target{id}},insights.metric(post_media_view)',
            'limit' => 25,
            'access_token' => $account->access_token,
        ]);

        if (! $postsResp->successful()) {
            $postsResp = Http::get("https://graph.facebook.com/{$version}/{$account->external_id}/posts", [
                'fields' => 'id,message,story,created_time,permalink_url,full_picture,likes.summary(true),comments.summary(true),shares,attachments{target{id}}',
                'limit' => 25,
                'access_token' => $account->access_token,
            ]);
        }

        $videoViewsByUrl = [];
        $videoViewsById = [];
        $videosResp = Http::get("https://graph.facebook.com/{$version}/{$account->external_id}/videos", [
            'fields' => 'id,views,permalink_url',
            'limit' => 25,
            'access_token' => $account->access_token,
        ]);
        if ($videosResp->successful()) {
            foreach ($videosResp->json('data', []) as $v) {
                $vViews = (int) ($v['views'] ?? 0);
                if (! empty($v['id'])) {
                    $videoViewsById[$v['id']] = $vViews;
                }
                if (! empty($v['permalink_url'])) {
                    $videoViewsByUrl[$v['permalink_url']] = $vViews;
                }
            }
        }

        $base['source'] = 'live';
        $base['channel_meta'] = [
            'channel_url' => $pageData['link'] ?? "https://www.facebook.com/{$account->external_id}",
        ];
        $base['summary']['followers_count'] = $followers;

        $items = [];
        foreach ($postsResp->json('data', []) as $post) {
            $likes = (int) ($post['likes']['summary']['total_count'] ?? 0);
            $comments = (int) ($post['comments']['summary']['total_count'] ?? 0);
            $shares = (int) ($post['shares']['count'] ?? 0);
            $views = (int) ($post['insights']['data'][0]['values'][0]['value'] ?? 0);
            $targetId = $post['attachments']['data'][0]['target']['id'] ?? null;
            if ($views === 0 && $targetId && isset($videoViewsById[$targetId])) {
                $views = $videoViewsById[$targetId];
            }
            if ($views === 0 && ! empty($post['permalink_url']) && isset($videoViewsByUrl[$post['permalink_url']])) {
                $views = $videoViewsByUrl[$post['permalink_url']];
            }
            $title = mb_strimwidth((string) ($post['message'] ?? ($post['story'] ?? 'Facebook Post')), 0, 80, '…');
            $items[] = [
                'id' => $post['id'],
                'title' => $title,
                'thumbnail_url' => $post['full_picture'] ?? null,
                'published_at' => $post['created_time'] ?? null,
                'duration_seconds' => null,
                'type' => 'post',
                'views' => $views,
                'likes' => $likes,
                'comments' => $comments,
                'engagement_rate' => round((($likes + $comments + $shares) / max(1, $views ?: $followers)) * 100, 2),
                'url' => $post['permalink_url'] ?? null,
            ];
        }

        $totalViews = max(array_sum(array_column($items, 'views')), array_sum($videoViewsById));
        $count = count($items);
        $base['summary']['posts_count'] = max($account->posts_count, $count);
        $base['summary']['views_count'] = $totalViews;
        $base['summary']['recent_videos_count'] = $count;
        $base['summary']['recent_total_views'] = $totalViews;
        $base['summary']['recent_total_likes'] = array_sum(array_column($items, 'likes'));
        $base['summary']['recent_total_comments'] = array_sum(array_column($items, 'comments'));
        $base['summary']['avg_views_per_video'] = $count > 0 ? (int) round($totalViews / $count) : 0;
        if ($count > 0 && $followers > 0) {
            $avgEng = array_sum(array_column($items, 'engagement_rate')) / $count;
            $base['summary']['engagement_rate'] = round($avgEng, 2);
        }

        $sorted = $items;
        usort($sorted, fn ($a, $b) => ($b['views'] ?: ($b['likes'] + $b['comments'])) <=> ($a['views'] ?: ($a['likes'] + $a['comments'])));
        $base['top_items'] = array_slice($sorted, 0, 5);
        $base['recent_items'] = $items;

        return $base;
    }

    protected function getFacebookPostAnalytics(SocialAccount $account, string $postId, bool $forceRefresh = false): array
    {
        $cached = SocialVideoAnalytic::where('social_account_id', $account->id)
            ->where('external_video_id', $postId)
            ->first();

        if (! $forceRefresh && $cached && is_array($cached->payload)) {
            return array_merge($cached->payload, [
                'account' => $account,
                'source' => 'cache',
                'synced_at' => $cached->synced_at?->toIso8601String(),
            ]);
        }

        $version = config('services.instagram.graph_version', 'v21.0');
        $postResp = Http::get("https://graph.facebook.com/{$version}/{$postId}", [
            'fields' => 'id,message,story,created_time,permalink_url,full_picture,likes.summary(true),comments.summary(true),shares,insights.metric(post_media_view)',
            'access_token' => $account->access_token,
        ]);

        if (! $postResp->successful()) {
            $postResp = Http::get("https://graph.facebook.com/{$version}/{$postId}", [
                'fields' => 'id,message,story,created_time,permalink_url,full_picture,likes.summary(true),comments.summary(true),shares',
                'access_token' => $account->access_token,
            ]);
        }

        if (! $postResp->successful()) {
            throw new RuntimeException('Unable to fetch Facebook post details.');
        }

        $post = $postResp->json();
        $message = (string) ($post['message'] ?? ($post['story'] ?? ''));
        $likes = (int) ($post['likes']['summary']['total_count'] ?? 0);
        $commentsCount = (int) ($post['comments']['summary']['total_count'] ?? 0);
        $shares = (int) ($post['shares']['count'] ?? 0);
        $views = (int) ($post['insights']['data'][0]['values'][0]['value'] ?? 0);
        $followers = max(1, (int) $account->followers_count);

        $recentComments = [];
        $commentsResp = Http::get("https://graph.facebook.com/{$version}/{$postId}/comments", [
            'fields' => 'id,message,from,created_time,like_count',
            'limit' => 10,
            'access_token' => $account->access_token,
        ]);
        if ($commentsResp->successful()) {
            foreach ($commentsResp->json('data', []) as $c) {
                $recentComments[] = [
                    'id' => $c['id'] ?? uniqid(),
                    'author' => $c['from']['name'] ?? 'Facebook User',
                    'author_avatar' => null,
                    'text' => $c['message'] ?? '',
                    'likes' => (int) ($c['like_count'] ?? 0),
                    'published_at' => $c['created_time'] ?? null,
                ];
            }
        }

        $publishedAt = isset($post['created_time']) ? Carbon::parse($post['created_time']) : null;
        $daysSince = $publishedAt ? max(1, (int) $publishedAt->diffInDays(now())) : 1;
        preg_match_all('/#[\p{L}\p{N}_]+/u', $message, $hashMatches);
        $hashtags = $hashMatches[0] ?? [];

        $checks = [
            ['label' => 'Post copy depth (80+ chars)', 'passed' => mb_strlen($message) >= 80, 'value' => mb_strlen($message).' chars'],
            ['label' => 'Hashtags included (2+)', 'passed' => count($hashtags) >= 2, 'value' => count($hashtags).' hashtags'],
            ['label' => 'Visual attached', 'passed' => ! empty($post['full_picture']), 'value' => ! empty($post['full_picture']) ? 'Yes' : 'No'],
            ['label' => 'Shares recorded', 'passed' => $shares > 0, 'value' => $shares.' shares'],
        ];
        $seoScore = (int) round((count(array_filter($checks, fn ($c) => $c['passed'])) / count($checks)) * 100);

        $payload = [
            'video' => [
                'id' => $post['id'],
                'title' => mb_strimwidth($message ?: 'Facebook Post', 0, 80, '…'),
                'description' => $message,
                'thumbnail_url' => $post['full_picture'] ?? null,
                'published_at' => $post['created_time'] ?? null,
                'duration_seconds' => null,
                'type' => 'post',
                'tags' => $hashtags,
                'definition' => 'HD',
                'has_captions' => false,
                'privacy_status' => 'public',
                'url' => $post['permalink_url'] ?? null,
            ],
            'metrics' => [
                'views' => $views ?: ($likes + $commentsCount + $shares),
                'shares' => $shares,
                'likes' => $likes,
                'comments' => $commentsCount,
                'engagement_rate' => round((($likes + $commentsCount + $shares) / max(1, $views ?: $followers)) * 100, 2),
                'like_rate' => round(($likes / max(1, $views ?: $followers)) * 100, 2),
                'comment_rate' => round(($commentsCount / max(1, $views ?: $followers)) * 100, 2),
                'days_since_published' => $daysSince,
                'views_per_day' => round(($views ?: ($likes + $commentsCount + $shares)) / $daysSince, 1),
            ],
            'seo' => [
                'score' => $seoScore,
                'checks' => $checks,
            ],
            'recent_comments' => $recentComments,
            'deep_analytics' => null,
        ];

        $now = now();
        SocialVideoAnalytic::updateOrCreate(
            [
                'social_account_id' => $account->id,
                'external_video_id' => $post['id'],
            ],
            [
                'payload' => $payload,
                'synced_at' => $now,
            ]
        );

        return array_merge($payload, [
            'account' => $account,
            'source' => 'live',
            'synced_at' => $now->toIso8601String(),
        ]);
    }

    protected function syncFacebook(SocialAccount $account): SocialAccount
    {
        if (! $account->external_id) {
            $account->update(['last_synced_at' => now()]);
            return $account->fresh();
        }

        $version = config('services.instagram.graph_version', 'v21.0');
        $resp = Http::get("https://graph.facebook.com/{$version}/{$account->external_id}", [
            'fields' => 'id,name,username,fan_count,followers_count,picture{url}',
            'access_token' => $account->access_token,
        ]);

        if ($resp->status() === 401 || $resp->status() === 400) {
            $account->update(['status' => 'needs_reauth']);
            return $account->fresh();
        }

        if ($resp->successful()) {
            $data = $resp->json();
            $followers = (int) ($data['followers_count'] ?? ($data['fan_count'] ?? $account->followers_count));

            $engagement = (float) ($account->engagement_rate ?? 0);
            $postsResp = Http::get("https://graph.facebook.com/{$version}/{$account->external_id}/posts", [
                'fields' => 'likes.summary(true),comments.summary(true),shares',
                'limit' => 10,
                'access_token' => $account->access_token,
            ]);

            if ($postsResp->successful() && $followers > 0) {
                $posts = $postsResp->json('data', []);
                if (count($posts) > 0) {
                    $interactions = collect($posts)->sum(fn ($p) => (int) ($p['likes']['summary']['total_count'] ?? 0)
                        + (int) ($p['comments']['summary']['total_count'] ?? 0)
                        + (int) ($p['shares']['count'] ?? 0));
                    $engagement = round((($interactions / count($posts)) / $followers) * 100, 2);
                }
            }

            $account->fill([
                'account_name' => $data['name'] ?? $account->account_name,
                'handle' => ! empty($data['username']) ? '@'.$data['username'] : $account->handle,
                'avatar_url' => $data['picture']['data']['url'] ?? $account->avatar_url,
                'followers_count' => $followers,
                'engagement_rate' => $engagement,
                'status' => 'connected',
                'last_synced_at' => now(),
            ]);
            $account->save();
        }

        return $account->fresh();
    }

    /**
     * Get per-post / per-reel Instagram Insights from DB cache, or fetch live on first load / refresh.
     */
    public function getInstagramMediaAnalytics(SocialAccount $account, string $mediaId, bool $forceRefresh = false): array
    {
        $cached = SocialVideoAnalytic::where('social_account_id', $account->id)
            ->where('external_video_id', $mediaId)
            ->first();

        if (! $forceRefresh && $cached && is_array($cached->payload)) {
            return array_merge($cached->payload, [
                'account' => $account,
                'source' => 'cache',
                'synced_at' => $cached->synced_at?->toIso8601String(),
            ]);
        }

        if (! $account->access_token) {
            throw new RuntimeException('Instagram token is missing. Please reconnect your Instagram account.');
        }

        $version = config('services.instagram.graph_version', 'v21.0');
        $mediaResp = Http::get("https://graph.facebook.com/{$version}/{$mediaId}", [
            'fields' => 'id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count',
            'access_token' => $account->access_token,
        ]);

        if (! $mediaResp->successful()) {
            throw new RuntimeException('Unable to fetch Instagram post details. Token may need re-authentication.');
        }

        $post = $mediaResp->json();
        $caption = (string) ($post['caption'] ?? '');
        $likes = (int) ($post['like_count'] ?? 0);
        $commentsCount = (int) ($post['comments_count'] ?? 0);
        $followers = max(1, (int) $account->followers_count);

        // Fetch Instagram Insights (views, reach, saved, shares, total_interactions).
        $insights = ['views' => 0, 'reach' => 0, 'saved' => 0, 'shares' => 0, 'total_interactions' => $likes + $commentsCount, 'plays' => 0];
        $metricsList = 'views,reach,saved,shares,total_interactions';

        $insightsResp = Http::get("https://graph.facebook.com/{$version}/{$mediaId}/insights", [
            'metric' => $metricsList,
            'access_token' => $account->access_token,
        ]);

        if ($insightsResp->successful()) {
            foreach ($insightsResp->json('data', []) as $m) {
                $name = $m['name'] ?? null;
                $val = $m['values'][0]['value'] ?? 0;
                if ($name && array_key_exists($name, $insights)) {
                    $insights[$name] = (int) $val;
                }
            }
        }

        $recentComments = [];
        $commentsResp = Http::get("https://graph.facebook.com/{$version}/{$mediaId}/comments", [
            'fields' => 'id,text,username,timestamp,like_count',
            'limit' => 10,
            'access_token' => $account->access_token,
        ]);
        if ($commentsResp->successful()) {
            foreach ($commentsResp->json('data', []) as $c) {
                $recentComments[] = [
                    'id' => $c['id'] ?? uniqid(),
                    'author' => '@'.($c['username'] ?? 'user'),
                    'author_avatar' => null,
                    'text' => $c['text'] ?? '',
                    'likes' => (int) ($c['like_count'] ?? 0),
                    'published_at' => $c['timestamp'] ?? null,
                ];
            }
        }

        $publishedAt = isset($post['timestamp']) ? Carbon::parse($post['timestamp']) : null;
        $daysSince = $publishedAt ? max(1, (int) $publishedAt->diffInDays(now())) : 1;
        preg_match_all('/#[\p{L}\p{N}_]+/u', $caption, $hashMatches);
        $hashtags = $hashMatches[0] ?? [];

        $checks = [
            ['label' => 'Caption depth (100+ chars)', 'passed' => mb_strlen($caption) >= 100, 'value' => mb_strlen($caption).' chars'],
            ['label' => 'Hashtags included (3+)', 'passed' => count($hashtags) >= 3, 'value' => count($hashtags).' hashtags'],
            ['label' => 'Saves recorded', 'passed' => $insights['saved'] > 0, 'value' => $insights['saved'].' saves'],
            ['label' => 'Shares recorded', 'passed' => $insights['shares'] > 0, 'value' => $insights['shares'].' shares'],
        ];
        $seoScore = (int) round((count(array_filter($checks, fn ($c) => $c['passed'])) / count($checks)) * 100);

        $payload = [
            'video' => [
                'id' => $post['id'],
                'title' => mb_strimwidth($caption ?: 'Instagram Post', 0, 80, '…'),
                'description' => $caption,
                'thumbnail_url' => $post['thumbnail_url'] ?? ($post['media_url'] ?? null),
                'published_at' => $post['timestamp'] ?? null,
                'duration_seconds' => null,
                'type' => strtolower((string) ($post['media_product_type'] ?? $post['media_type'] ?? 'post')),
                'tags' => $hashtags,
                'definition' => 'HD',
                'has_captions' => false,
                'privacy_status' => 'public',
                'url' => $post['permalink'] ?? null,
            ],
            'metrics' => [
                'views' => $insights['views'] ?: ($insights['plays'] ?: $insights['reach']),
                'reach' => $insights['reach'],
                'plays' => $insights['views'] ?: $insights['plays'],
                'saved' => $insights['saved'],
                'shares' => $insights['shares'],
                'likes' => $likes,
                'comments' => $commentsCount,
                'engagement_rate' => round((($likes + $commentsCount + $insights['saved'] + $insights['shares']) / max(1, $insights['reach'] ?: $followers)) * 100, 2),
                'like_rate' => round(($likes / max(1, $insights['reach'] ?: $followers)) * 100, 2),
                'comment_rate' => round(($commentsCount / max(1, $insights['reach'] ?: $followers)) * 100, 2),
                'days_since_published' => $daysSince,
                'views_per_day' => round(($insights['plays'] ?: $insights['reach']) / $daysSince, 1),
            ],
            'seo' => [
                'score' => $seoScore,
                'checks' => $checks,
            ],
            'recent_comments' => $recentComments,
            'deep_analytics' => null,
        ];

        $now = now();
        SocialVideoAnalytic::updateOrCreate(
            [
                'social_account_id' => $account->id,
                'external_video_id' => $post['id'],
            ],
            [
                'payload' => $payload,
                'synced_at' => $now,
            ]
        );

        return array_merge($payload, [
            'account' => $account,
            'source' => 'live',
            'synced_at' => $now->toIso8601String(),
        ]);
    }

    /**
     * Get per-video YouTube analytics from DB cache, or fetch live on first load or explicit refresh.
     */
    public function getYouTubeVideoAnalytics(SocialAccount $account, string $videoId, bool $forceRefresh = false): array
    {
        if ($account->platform !== 'youtube') {
            throw new RuntimeException('Video analytics is only supported for YouTube channels.');
        }

        $cached = SocialVideoAnalytic::where('social_account_id', $account->id)
            ->where('external_video_id', $videoId)
            ->first();

        if (! $forceRefresh && $cached && is_array($cached->payload)) {
            return array_merge($cached->payload, [
                'account' => $account,
                'source' => 'cache',
                'synced_at' => $cached->synced_at?->toIso8601String(),
            ]);
        }

        $accessToken = $this->ensureFreshYouTubeToken($account);
        if (! $accessToken) {
            throw new RuntimeException('YouTube token is missing or expired. Please reconnect your channel.');
        }

        $resp = Http::withToken($accessToken)->get('https://www.googleapis.com/youtube/v3/videos', [
            'part' => 'snippet,statistics,contentDetails,status',
            'id' => $videoId,
        ]);

        if ($resp->status() === 401) {
            $account->update(['status' => 'needs_reauth']);
            throw new RuntimeException('YouTube authorization expired. Please reconnect your channel.');
        }

        $video = $resp->successful() ? $resp->json('items.0') : null;
        if (! $video) {
            throw new RuntimeException('Video not found on YouTube.');
        }

        $snippet = $video['snippet'] ?? [];
        $stats = $video['statistics'] ?? [];
        $contentDetails = $video['contentDetails'] ?? [];
        $status = $video['status'] ?? [];

        $title = (string) ($snippet['title'] ?? 'Untitled');
        $description = (string) ($snippet['description'] ?? '');
        $tags = $snippet['tags'] ?? [];
        $durationSec = $this->parseIsoDurationSeconds((string) ($contentDetails['duration'] ?? ''));
        $isShort = ($durationSec > 0 && $durationSec <= 60) || str_contains(strtolower($title), '#short');

        $views = (int) ($stats['viewCount'] ?? 0);
        $likes = (int) ($stats['likeCount'] ?? 0);
        $comments = (int) ($stats['commentCount'] ?? 0);

        $publishedAt = isset($snippet['publishedAt']) ? Carbon::parse($snippet['publishedAt']) : null;
        $daysSince = $publishedAt ? max(1, (int) $publishedAt->diffInDays(now())) : 1;

        $hashtagsCount = preg_match_all('/#[\p{L}\p{N}_]+/u', $description);
        $hasCaptions = ($contentDetails['caption'] ?? 'false') === 'true';
        $isHd = strtolower((string) ($contentDetails['definition'] ?? 'sd')) === 'hd';

        $checks = [
            ['label' => 'Title length (30–70 chars)', 'passed' => mb_strlen($title) >= 30 && mb_strlen($title) <= 70, 'value' => mb_strlen($title).' chars'],
            ['label' => 'Description depth (150+ chars)', 'passed' => mb_strlen($description) >= 150, 'value' => mb_strlen($description).' chars'],
            ['label' => 'Tags added (5+ tags)', 'passed' => count($tags) >= 5, 'value' => count($tags).' tags'],
            ['label' => 'Hashtags in description (2+)', 'passed' => $hashtagsCount >= 2, 'value' => $hashtagsCount.' hashtags'],
            ['label' => 'HD quality', 'passed' => $isHd, 'value' => strtoupper((string) ($contentDetails['definition'] ?? 'sd'))],
            ['label' => 'Captions enabled', 'passed' => $hasCaptions, 'value' => $hasCaptions ? 'Yes' : 'No'],
        ];
        $passedCount = count(array_filter($checks, fn ($c) => $c['passed']));
        $seoScore = (int) round(($passedCount / count($checks)) * 100);

        // Fetch top recent comments (best-effort; disabled comments return 403).
        $recentComments = [];
        $commentsResp = Http::withToken($accessToken)->get('https://www.googleapis.com/youtube/v3/commentThreads', [
            'part' => 'snippet',
            'videoId' => $videoId,
            'maxResults' => 10,
            'order' => 'relevance',
            'textFormat' => 'plainText',
        ]);

        if ($commentsResp->successful()) {
            foreach ($commentsResp->json('items', []) as $thread) {
                $top = $thread['snippet']['topLevelComment']['snippet'] ?? [];
                $recentComments[] = [
                    'id' => $thread['id'] ?? uniqid(),
                    'author' => $top['authorDisplayName'] ?? 'Viewer',
                    'author_avatar' => $top['authorProfileImageUrl'] ?? null,
                    'text' => $top['textDisplay'] ?? '',
                    'likes' => (int) ($top['likeCount'] ?? 0),
                    'published_at' => $top['publishedAt'] ?? null,
                ];
            }
        }

        $thumbnails = $snippet['thumbnails'] ?? [];
        $thumbnailUrl = $thumbnails['maxres']['url']
            ?? $thumbnails['high']['url']
            ?? $thumbnails['medium']['url']
            ?? ($thumbnails['default']['url'] ?? null);

        $payload = [
            'video' => [
                'id' => $video['id'],
                'title' => $title,
                'description' => $description,
                'thumbnail_url' => $thumbnailUrl,
                'published_at' => $snippet['publishedAt'] ?? null,
                'duration_seconds' => $durationSec,
                'type' => $isShort ? 'short' : 'video',
                'tags' => $tags,
                'definition' => strtoupper((string) ($contentDetails['definition'] ?? 'sd')),
                'has_captions' => $hasCaptions,
                'privacy_status' => $status['privacyStatus'] ?? 'public',
                'made_for_kids' => (bool) ($status['madeForKids'] ?? false),
                'url' => "https://www.youtube.com/watch?v={$video['id']}",
            ],
            'metrics' => [
                'views' => $views,
                'likes' => $likes,
                'comments' => $comments,
                'engagement_rate' => $views > 0 ? round((($likes + $comments) / $views) * 100, 2) : 0,
                'like_rate' => $views > 0 ? round(($likes / $views) * 100, 2) : 0,
                'comment_rate' => $views > 0 ? round(($comments / $views) * 100, 2) : 0,
                'days_since_published' => $daysSince,
                'views_per_day' => round($views / $daysSince, 1),
            ],
            'seo' => [
                'score' => $seoScore,
                'checks' => $checks,
            ],
            'recent_comments' => $recentComments,
            'deep_analytics' => $this->fetchYouTubeDeepAnalytics($accessToken, $video['id']),
        ];

        $now = now();
        SocialVideoAnalytic::updateOrCreate(
            [
                'social_account_id' => $account->id,
                'external_video_id' => $video['id'],
            ],
            [
                'payload' => $payload,
                'synced_at' => $now,
            ]
        );

        return array_merge($payload, [
            'account' => $account,
            'source' => 'live',
            'synced_at' => $now->toIso8601String(),
        ]);
    }

    protected function syncYouTube(SocialAccount $account): SocialAccount
    {
        $accessToken = $this->ensureFreshYouTubeToken($account);
        if (! $accessToken) {
            return $account->fresh();
        }

        $params = ['part' => 'snippet,statistics'];
        if ($account->external_id) {
            $params['id'] = $account->external_id;
        } else {
            $params['mine'] = 'true';
        }

        $resp = Http::withToken($accessToken)->get('https://www.googleapis.com/youtube/v3/channels', $params);

        if ($resp->status() === 401) {
            $account->update(['status' => 'needs_reauth']);
            return $account->fresh();
        }

        if ($resp->successful() && ($item = $resp->json('items.0'))) {
            $stats = $item['statistics'] ?? [];
            $snippet = $item['snippet'] ?? [];
            $account->fill([
                'account_name' => $snippet['title'] ?? $account->account_name,
                'avatar_url' => $snippet['thumbnails']['default']['url'] ?? $account->avatar_url,
                'followers_count' => (int) ($stats['subscriberCount'] ?? $account->followers_count),
                'views_count' => (int) ($stats['viewCount'] ?? $account->views_count),
                'posts_count' => (int) ($stats['videoCount'] ?? $account->posts_count),
                'status' => 'connected',
                'last_synced_at' => now(),
            ]);
            $account->save();
        }

        return $account->fresh();
    }

    protected function syncInstagram(SocialAccount $account): SocialAccount
    {
        if (! $account->external_id) {
            $account->update(['last_synced_at' => now()]);
            return $account->fresh();
        }

        $version = config('services.instagram.graph_version', 'v21.0');
        $resp = Http::get("https://graph.facebook.com/{$version}/{$account->external_id}", [
            'fields' => 'username,name,profile_picture_url,followers_count,media_count',
            'access_token' => $account->access_token,
        ]);

        if ($resp->status() === 401 || $resp->status() === 400) {
            $account->update(['status' => 'needs_reauth']);
            return $account->fresh();
        }

        if ($resp->successful()) {
            $data = $resp->json();
            $followers = (int) ($data['followers_count'] ?? $account->followers_count);

            // Compute engagement rate from recent media
            $engagement = (float) ($account->engagement_rate ?? 0);
            $mediaResp = Http::get("https://graph.facebook.com/{$version}/{$account->external_id}/media", [
                'fields' => 'like_count,comments_count',
                'limit' => 10,
                'access_token' => $account->access_token,
            ]);

            if ($mediaResp->successful() && $followers > 0) {
                $posts = $mediaResp->json('data', []);
                if (count($posts) > 0) {
                    $interactions = collect($posts)->sum(fn ($p) => (int) ($p['like_count'] ?? 0) + (int) ($p['comments_count'] ?? 0));
                    $avgInteractions = $interactions / count($posts);
                    $engagement = round(($avgInteractions / $followers) * 100, 2);
                }
            }

            $account->fill([
                'account_name' => $data['name'] ?? $account->account_name,
                'handle' => isset($data['username']) ? '@'.$data['username'] : $account->handle,
                'avatar_url' => $data['profile_picture_url'] ?? $account->avatar_url,
                'followers_count' => $followers,
                'posts_count' => (int) ($data['media_count'] ?? $account->posts_count),
                'engagement_rate' => $engagement,
                'status' => 'connected',
                'last_synced_at' => now(),
            ]);
            $account->save();
        }

        return $account->fresh();
    }
}
