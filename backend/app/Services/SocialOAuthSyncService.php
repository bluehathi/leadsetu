<?php

namespace App\Services;

use App\Models\SocialAccount;
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
                'scope' => 'https://www.googleapis.com/auth/youtube.readonly',
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

        return "https://www.facebook.com/{$version}/dialog/oauth?".http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirect,
            'response_type' => 'code',
            'scope' => 'instagram_basic,pages_show_list,instagram_manage_insights',
            'state' => $state,
        ]);
    }

    /**
     * Handle OAuth callback, exchange code for tokens, and connect all discovered YT/IG accounts.
     *
     * @return SocialAccount[]
     */
    public function handleCallback(string $platform, string $code, string $encryptedState): array
    {
        $payload = json_decode(Crypt::decryptString($encryptedState), true);
        if (! is_array($payload) || ($payload['platform'] ?? null) !== $platform) {
            throw new RuntimeException('Invalid OAuth state.');
        }

        $workspaceId = (int) $payload['workspace_id'];
        $userId = (int) $payload['user_id'];

        return $platform === 'youtube'
            ? $this->connectYouTube($code, $workspaceId, $userId)
            : $this->connectInstagram($code, $workspaceId, $userId);
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

            $account = SocialAccount::withoutGlobalScopes()->updateOrCreate(
                [
                    'workspace_id' => $workspaceId,
                    'platform' => 'youtube',
                    'external_id' => $item['id'],
                ],
                [
                    'user_id' => $userId,
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
                ]
            );

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

        $pagesResp = Http::get("https://graph.facebook.com/{$version}/me/accounts", [
            'fields' => 'instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count}',
            'access_token' => $accessToken,
        ]);

        if (! $pagesResp->successful()) {
            throw new RuntimeException('Failed to fetch linked Instagram Business accounts.');
        }

        $connected = [];
        foreach ($pagesResp->json('data', []) as $page) {
            $ig = $page['instagram_business_account'] ?? null;
            if (! $ig) {
                continue;
            }

            $username = $ig['username'] ?? 'instagram';
            $account = SocialAccount::withoutGlobalScopes()->updateOrCreate(
                [
                    'workspace_id' => $workspaceId,
                    'platform' => 'instagram',
                    'external_id' => $ig['id'],
                ],
                [
                    'user_id' => $userId,
                    'account_name' => $ig['name'] ?? $username,
                    'handle' => "@{$username}",
                    'avatar_url' => $ig['profile_picture_url'] ?? null,
                    'followers_count' => (int) ($ig['followers_count'] ?? 0),
                    'posts_count' => (int) ($ig['media_count'] ?? 0),
                    'access_token' => $accessToken,
                    'token_expires_at' => $expiresAt,
                    'status' => 'connected',
                    'last_synced_at' => now(),
                ]
            );

            $connected[] = $this->syncInstagram($account);
        }

        return $connected;
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

        return $account->platform === 'youtube'
            ? $this->syncYouTube($account)
            : $this->syncInstagram($account);
    }

    protected function syncYouTube(SocialAccount $account): SocialAccount
    {
        $accessToken = $account->access_token;

        if ($account->token_expires_at && $account->token_expires_at->isPast() && $account->refresh_token) {
            $refreshResp = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'client_id' => config('services.youtube.client_id'),
                'client_secret' => config('services.youtube.client_secret'),
                'refresh_token' => $account->refresh_token,
                'grant_type' => 'refresh_token',
            ]);

            if (! $refreshResp->successful()) {
                $account->update(['status' => 'needs_reauth']);
                return $account->fresh();
            }

            $accessToken = $refreshResp->json('access_token');
            $account->access_token = $accessToken;
            if ($expiresIn = $refreshResp->json('expires_in')) {
                $account->token_expires_at = now()->addSeconds((int) $expiresIn);
            }
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
            $engagement = $account->engagement_rate;
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
