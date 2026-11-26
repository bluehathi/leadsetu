<?php

namespace App\Services;

use App\Models\GoogleDriveConnection;
use App\Models\SocialContent;
use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GoogleDriveService
{
    public function __construct(
        protected SocialOAuthSyncService $socialSync,
    ) {
    }

    public function getAuthUrl(User $user): string
    {
        $clientId = config('services.youtube.client_id');
        $redirect = config('services.youtube.redirect') ?: url('/api/v1/social/oauth/youtube/callback');
        if (! $clientId) {
            throw new RuntimeException('YOUTUBE_CLIENT_ID is not configured in backend .env.');
        }

        $state = Crypt::encryptString(json_encode([
            'flow' => 'google_drive',
            'user_id' => $user->id,
            'workspace_id' => $user->workspace_id,
            'issued_at' => now()->timestamp,
        ]));

        return 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirect,
            'response_type' => 'code',
            'scope' => 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email',
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $state,
        ]);
    }

    public function isDriveState(string $encryptedState): bool
    {
        try {
            $payload = json_decode(Crypt::decryptString($encryptedState), true);
            return is_array($payload) && ($payload['flow'] ?? null) === 'google_drive';
        } catch (\Throwable) {
            return false;
        }
    }

    public function handleCallback(string $code, string $encryptedState): GoogleDriveConnection
    {
        $payload = json_decode(Crypt::decryptString($encryptedState), true);
        if (! is_array($payload) || ($payload['flow'] ?? null) !== 'google_drive') {
            throw new RuntimeException('Invalid Google Drive OAuth state.');
        }

        $workspaceId = (int) $payload['workspace_id'];
        $userId = (int) $payload['user_id'];
        $redirect = config('services.youtube.redirect') ?: url('/api/v1/social/oauth/youtube/callback');

        $tokenResp = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.youtube.client_id'),
            'client_secret' => config('services.youtube.client_secret'),
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $redirect,
        ]);

        if (! $tokenResp->successful()) {
            throw new RuntimeException('Failed to exchange Google Drive OAuth code.');
        }

        $tokens = $tokenResp->json();
        $accessToken = $tokens['access_token'] ?? null;
        $refreshToken = $tokens['refresh_token'] ?? null;
        $expiresAt = isset($tokens['expires_in']) ? now()->addSeconds((int) $tokens['expires_in']) : null;

        $userInfo = Http::withToken($accessToken)->get('https://www.googleapis.com/oauth2/v2/userinfo');
        $email = $userInfo->successful() ? ($userInfo->json('email') ?: null) : null;

        $conn = GoogleDriveConnection::withoutGlobalScopes()->firstOrNew([
            'workspace_id' => $workspaceId,
        ]);

        $conn->forceFill([
            'workspace_id' => $workspaceId,
            'user_id' => $userId,
            'google_email' => $email ?: $conn->google_email,
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken ?: $conn->refresh_token,
            'token_expires_at' => $expiresAt,
        ]);
        $conn->save();

        return $conn;
    }

    public function ensureFreshToken(GoogleDriveConnection $conn): string
    {
        if (! $conn->access_token) {
            throw new RuntimeException('Google Drive is not connected.');
        }

        if ($conn->token_expires_at && $conn->token_expires_at->isPast() && $conn->refresh_token) {
            $refreshResp = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'client_id' => config('services.youtube.client_id'),
                'client_secret' => config('services.youtube.client_secret'),
                'refresh_token' => $conn->refresh_token,
                'grant_type' => 'refresh_token',
            ]);

            if (! $refreshResp->successful()) {
                throw new RuntimeException('Google Drive token expired. Please reconnect Google Drive.');
            }

            $conn->access_token = $refreshResp->json('access_token');
            if ($expiresIn = $refreshResp->json('expires_in')) {
                $conn->token_expires_at = now()->addSeconds((int) $expiresIn);
            }
            $conn->save();
        }

        return $conn->access_token;
    }

    public function listFiles(GoogleDriveConnection $conn, ?string $folderId = null, ?string $search = null): array
    {
        $token = $this->ensureFreshToken($conn);

        $clauses = ['trashed = false'];
        if ($search) {
            $escaped = str_replace("'", "\\'", $search);
            $clauses[] = "name contains '{$escaped}'";
        } else {
            $parent = $folderId ?: 'root';
            $clauses[] = "'{$parent}' in parents";
        }
        $clauses[] = "(mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'video/' or mimeType contains 'image/')";

        $resp = Http::withToken($token)->get('https://www.googleapis.com/drive/v3/files', [
            'q' => implode(' and ', $clauses),
            'fields' => 'files(id,name,mimeType,size,thumbnailLink,webViewLink,modifiedTime,videoMediaMetadata)',
            'orderBy' => 'folder,modifiedTime desc',
            'pageSize' => 60,
            'supportsAllDrives' => 'true',
            'includeItemsFromAllDrives' => 'true',
        ]);

        if (! $resp->successful()) {
            $msg = $resp->json('error.message') ?: 'Failed to list Google Drive files.';
            throw new RuntimeException($msg);
        }

        return collect($resp->json('files', []))->map(fn (array $f) => [
            'id' => $f['id'],
            'name' => $f['name'],
            'mime_type' => $f['mimeType'],
            'is_folder' => ($f['mimeType'] ?? '') === 'application/vnd.google-apps.folder',
            'is_video' => str_starts_with((string) ($f['mimeType'] ?? ''), 'video/'),
            'is_image' => str_starts_with((string) ($f['mimeType'] ?? ''), 'image/'),
            'size' => isset($f['size']) ? (int) $f['size'] : null,
            'thumbnail_url' => $f['thumbnailLink'] ?? null,
            'web_view_url' => $f['webViewLink'] ?? null,
            'modified_time' => $f['modifiedTime'] ?? null,
            'duration_millis' => isset($f['videoMediaMetadata']['durationMillis'])
                ? (int) $f['videoMediaMetadata']['durationMillis']
                : null,
        ])->values()->all();
    }

    public function publishContentToYouTube(
        SocialContent $content,
        GoogleDriveConnection $driveConn,
        string $privacyStatus = 'private'
    ): SocialContent {
        if (! $content->drive_file_id) {
            throw new RuntimeException('No Google Drive video file is attached to this content.');
        }

        $account = $content->account;
        if (! $account || $account->platform !== 'youtube') {
            throw new RuntimeException('Selected content must belong to a connected YouTube channel.');
        }

        $ytToken = $this->socialSync->getFreshYouTubeToken($account);
        if (! $ytToken) {
            throw new RuntimeException('YouTube channel token is missing or expired. Please reconnect your YouTube channel.');
        }

        $driveToken = $this->ensureFreshToken($driveConn);
        $tempVideoPath = tempnam(sys_get_temp_dir(), 'yt_drive_');
        $tempThumbPath = null;

        try {
            // Stream video from Google Drive directly to disk to avoid loading large files into memory.
            $downloadResp = Http::withToken($driveToken)
                ->timeout(300)
                ->sink($tempVideoPath)
                ->get("https://www.googleapis.com/drive/v3/files/{$content->drive_file_id}", [
                    'alt' => 'media',
                    'supportsAllDrives' => 'true',
                ]);

            if (! $downloadResp->successful() || ! file_exists($tempVideoPath) || filesize($tempVideoPath) === 0) {
                throw new RuntimeException('Failed to download video file from Google Drive.');
            }

            $fileSize = filesize($tempVideoPath);
            $mimeType = $content->drive_mime_type ?: 'video/mp4';

            $description = (string) ($content->description ?? '');
            if (is_array($content->hashtags) && count($content->hashtags) > 0) {
                $tagsLine = implode(' ', array_map(fn ($h) => str_starts_with($h, '#') ? $h : "#{$h}", $content->hashtags));
                $description = trim($description."\n\n".$tagsLine);
            }

            // Step 1: Initiate YouTube resumable upload session.
            $initResp = Http::withToken($ytToken)
                ->withHeaders([
                    'X-Upload-Content-Length' => (string) $fileSize,
                    'X-Upload-Content-Type' => $mimeType,
                ])
                ->post('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', [
                    'snippet' => [
                        'title' => mb_substr($content->title, 0, 100),
                        'description' => mb_substr($description, 0, 5000),
                        'tags' => array_values(array_slice($content->tags ?? [], 0, 30)),
                    ],
                    'status' => [
                        'privacyStatus' => in_array($privacyStatus, ['private', 'unlisted', 'public'], true) ? $privacyStatus : 'private',
                    ],
                ]);

            if ($initResp->status() === 401 || $initResp->status() === 403) {
                $msg = $initResp->json('error.message') ?: 'YouTube upload permission missing. Please reconnect your YouTube channel to grant upload permission.';
                throw new RuntimeException($msg);
            }

            $uploadUrl = $initResp->header('Location');
            if (! $initResp->successful() || ! $uploadUrl) {
                throw new RuntimeException('Failed to initialize YouTube upload: '.($initResp->json('error.message') ?: $initResp->status()));
            }

            // Step 2: Upload the video file stream to the resumable upload URL.
            $stream = fopen($tempVideoPath, 'rb');
            $uploadResp = Http::withHeaders([
                'Content-Type' => $mimeType,
                'Content-Length' => (string) $fileSize,
            ])
                ->timeout(600)
                ->withBody($stream, $mimeType)
                ->put($uploadUrl);

            if (is_resource($stream)) {
                fclose($stream);
            }

            if (! $uploadResp->successful()) {
                throw new RuntimeException('YouTube video upload failed: '.($uploadResp->json('error.message') ?: $uploadResp->status()));
            }

            $youtubeVideoId = $uploadResp->json('id');

            // Step 3: Optionally upload custom thumbnail if attached from Drive.
            if ($youtubeVideoId && $content->drive_thumbnail_file_id) {
                $tempThumbPath = tempnam(sys_get_temp_dir(), 'yt_thumb_');
                $thumbDownload = Http::withToken($driveToken)
                    ->timeout(60)
                    ->sink($tempThumbPath)
                    ->get("https://www.googleapis.com/drive/v3/files/{$content->drive_thumbnail_file_id}", [
                        'alt' => 'media',
                        'supportsAllDrives' => 'true',
                    ]);

                if ($thumbDownload->successful() && file_exists($tempThumbPath) && filesize($tempThumbPath) > 0) {
                    $thumbStream = fopen($tempThumbPath, 'rb');
                    Http::withToken($ytToken)
                        ->withBody($thumbStream, 'image/jpeg')
                        ->post("https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={$youtubeVideoId}");
                    if (is_resource($thumbStream)) {
                        fclose($thumbStream);
                    }
                }
            }

            $content->forceFill([
                'youtube_video_id' => $youtubeVideoId,
                'status' => 'published',
                'published_at' => now(),
            ])->save();

            return $content->fresh()->load('account:id,platform,account_name,handle');
        } finally {
            if ($tempVideoPath && file_exists($tempVideoPath)) {
                @unlink($tempVideoPath);
            }
            if ($tempThumbPath && file_exists($tempThumbPath)) {
                @unlink($tempThumbPath);
            }
        }
    }
}
