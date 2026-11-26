<?php

namespace App\Services;

use App\Models\GoogleDriveConnection;
use App\Models\GoogleDriveFile;
use App\Models\SocialContent;
use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\URL;
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

    public function listFiles(
        GoogleDriveConnection $conn,
        ?string $folderId = null,
        ?string $search = null,
        bool $forceRefresh = false
    ): array {
        $parent = $folderId ?: 'root';

        if ($conn->lock_to_default_folder && $conn->default_folder_id) {
            if (! $folderId || $folderId === 'root') {
                $parent = $conn->default_folder_id;
            } elseif (! $this->isFolderWithinTree($conn->workspace_id, $conn->default_folder_id, $parent)) {
                throw new RuntimeException('Access is locked to the default Google Drive folder.');
            }
        }

        if (! $forceRefresh) {
            $query = GoogleDriveFile::query();
            if ($search) {
                $query->where('name', 'like', "%{$search}%");
                if ($conn->lock_to_default_folder && $conn->default_folder_id) {
                    $allowedParents = $this->getDescendantFolderIds($conn->workspace_id, $conn->default_folder_id);
                    $query->whereIn('parent_folder_id', $allowedParents);
                }
            } else {
                $query->where('parent_folder_id', $parent);
            }

            $cached = $query->orderByDesc('is_folder')->orderByDesc('modified_time')->get();
            if ($cached->isNotEmpty()) {
                return [
                    'items' => $cached->map(fn (GoogleDriveFile $f) => [
                        'id' => $f->drive_file_id,
                        'name' => $f->name,
                        'mime_type' => $f->mime_type,
                        'is_folder' => $f->is_folder,
                        'is_video' => $f->is_video,
                        'is_image' => $f->is_image,
                        'size' => $f->size,
                        'thumbnail_url' => $f->thumbnail_url,
                        'web_view_url' => $f->web_view_url,
                        'modified_time' => $f->modified_time?->toIso8601String(),
                        'duration_millis' => $f->duration_millis,
                    ])->values()->all(),
                    'source' => 'cache',
                    'synced_at' => $cached->max('synced_at')?->toIso8601String(),
                ];
            }
        }

        $token = $this->ensureFreshToken($conn);

        $clauses = ['trashed = false'];
        if ($search) {
            $escaped = str_replace("'", "\\'", $search);
            $clauses[] = "name contains '{$escaped}'";
            if ($conn->lock_to_default_folder && $conn->default_folder_id) {
                $clauses[] = "'{$conn->default_folder_id}' in parents";
            }
        } else {
            $clauses[] = "'{$parent}' in parents";
        }
        $clauses[] = "(mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'video/' or mimeType contains 'image/')";

        $resp = Http::withToken($token)->get('https://www.googleapis.com/drive/v3/files', [
            'q' => implode(' and ', $clauses),
            'fields' => 'files(id,name,mimeType,size,thumbnailLink,webViewLink,modifiedTime,videoMediaMetadata,parents)',
            'orderBy' => 'folder,modifiedTime desc',
            'pageSize' => 60,
            'supportsAllDrives' => 'true',
            'includeItemsFromAllDrives' => 'true',
        ]);

        if (! $resp->successful()) {
            $msg = $resp->json('error.message') ?: 'Failed to list Google Drive files.';
            throw new RuntimeException($msg);
        }

        $now = now();
        $items = collect($resp->json('files', []))->map(function (array $f) use ($conn, $parent, $search, $now) {
            $isFolder = ($f['mimeType'] ?? '') === 'application/vnd.google-apps.folder';
            $isVideo = str_starts_with((string) ($f['mimeType'] ?? ''), 'video/');
            $isImage = str_starts_with((string) ($f['mimeType'] ?? ''), 'image/');
            $itemParent = $search ? ($f['parents'][0] ?? $parent) : $parent;

            // Cache only folder/file metadata in DB — never copy file contents.
            $record = GoogleDriveFile::withoutGlobalScopes()->firstOrNew([
                'workspace_id' => $conn->workspace_id,
                'drive_file_id' => $f['id'],
            ]);
            $record->forceFill([
                'workspace_id' => $conn->workspace_id,
                'drive_file_id' => $f['id'],
                'parent_folder_id' => $itemParent,
                'name' => $f['name'],
                'mime_type' => $f['mimeType'],
                'is_folder' => $isFolder,
                'is_video' => $isVideo,
                'is_image' => $isImage,
                'size' => isset($f['size']) ? (int) $f['size'] : null,
                'thumbnail_url' => $f['thumbnailLink'] ?? null,
                'web_view_url' => $f['webViewLink'] ?? null,
                'modified_time' => isset($f['modifiedTime']) ? \Illuminate\Support\Carbon::parse($f['modifiedTime']) : null,
                'duration_millis' => isset($f['videoMediaMetadata']['durationMillis'])
                    ? (int) $f['videoMediaMetadata']['durationMillis']
                    : null,
                'synced_at' => $now,
            ])->save();

            return [
                'id' => $f['id'],
                'name' => $f['name'],
                'mime_type' => $f['mimeType'],
                'is_folder' => $isFolder,
                'is_video' => $isVideo,
                'is_image' => $isImage,
                'size' => isset($f['size']) ? (int) $f['size'] : null,
                'thumbnail_url' => $f['thumbnailLink'] ?? null,
                'web_view_url' => $f['webViewLink'] ?? null,
                'modified_time' => $f['modifiedTime'] ?? null,
                'duration_millis' => isset($f['videoMediaMetadata']['durationMillis'])
                    ? (int) $f['videoMediaMetadata']['durationMillis']
                    : null,
            ];
        })->values()->all();

        if (! $search) {
            $fetchedIds = array_column($items, 'id');
            GoogleDriveFile::withoutGlobalScopes()
                ->where('workspace_id', $conn->workspace_id)
                ->where('parent_folder_id', $parent)
                ->when(count($fetchedIds) > 0, fn ($q) => $q->whereNotIn('drive_file_id', $fetchedIds))
                ->delete();
        }

        return [
            'items' => $items,
            'source' => 'live',
            'synced_at' => $now->toIso8601String(),
        ];
    }

    protected function isFolderWithinTree(int $workspaceId, string $rootFolderId, string $targetFolderId): bool
    {
        return in_array($targetFolderId, $this->getDescendantFolderIds($workspaceId, $rootFolderId), true);
    }

    protected function getDescendantFolderIds(int $workspaceId, string $rootFolderId): array
    {
        $allFolders = GoogleDriveFile::withoutGlobalScopes()
            ->where('workspace_id', $workspaceId)
            ->where('is_folder', true)
            ->get(['drive_file_id', 'parent_folder_id'])
            ->groupBy('parent_folder_id');

        $result = [$rootFolderId];
        $queue = [$rootFolderId];
        while ($queue) {
            $current = array_shift($queue);
            foreach ($allFolders->get($current, []) as $child) {
                if (! in_array($child->drive_file_id, $result, true)) {
                    $result[] = $child->drive_file_id;
                    $queue[] = $child->drive_file_id;
                }
            }
        }

        return $result;
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

            $this->tryPostFirstComment($content);

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

    public function streamFileForSignedProxy(int $workspaceId, string $fileId): array
    {
        $conn = GoogleDriveConnection::withoutGlobalScopes()->where('workspace_id', $workspaceId)->first();
        if (! $conn) {
            throw new RuntimeException('Google Drive is not connected.');
        }

        $token = $this->ensureFreshToken($conn);
        $resp = Http::withToken($token)
            ->timeout(300)
            ->get("https://www.googleapis.com/drive/v3/files/{$fileId}", [
                'alt' => 'media',
                'supportsAllDrives' => 'true',
            ]);

        if (! $resp->successful()) {
            throw new RuntimeException('Failed to stream Google Drive media.');
        }

        return [
            'body' => $resp->body(),
            'content_type' => $resp->header('Content-Type') ?: 'application/octet-stream',
        ];
    }

    public function publishContentToInstagram(SocialContent $content, GoogleDriveConnection $driveConn): SocialContent
    {
        $fileId = $content->drive_file_id ?: $content->drive_thumbnail_file_id;
        if (! $fileId) {
            throw new RuntimeException('Attach a video or image from Google Drive first.');
        }

        $account = $content->account;
        if (! $account || $account->platform !== 'instagram' || ! $account->external_id) {
            throw new RuntimeException('Selected content must belong to a connected Instagram Business account.');
        }
        if (! $account->access_token) {
            throw new RuntimeException('Instagram token is missing. Please reconnect your Instagram account.');
        }

        $version = config('services.instagram.graph_version', 'v21.0');
        $mediaUrl = URL::temporarySignedRoute('social.drive.temp-media', now()->addMinutes(15), [
            'workspaceId' => $content->workspace_id,
            'fileId' => $fileId,
        ]);

        $caption = trim((string) ($content->title ? "{$content->title}\n\n" : '').(string) ($content->description ?? ''));
        if (is_array($content->hashtags) && count($content->hashtags) > 0) {
            $tagsLine = implode(' ', array_map(fn ($h) => str_starts_with($h, '#') ? $h : "#{$h}", $content->hashtags));
            $caption = trim($caption."\n\n".$tagsLine);
        }

        $isVideo = (bool) $content->drive_file_id && str_starts_with((string) ($content->drive_mime_type ?? 'video/'), 'video/');
        $containerParams = [
            'caption' => mb_substr($caption, 0, 2200),
            'access_token' => $account->access_token,
        ];
        if ($isVideo) {
            $containerParams['media_type'] = 'REELS';
            $containerParams['video_url'] = $mediaUrl;
        } else {
            $containerParams['image_url'] = $mediaUrl;
        }

        $createResp = Http::post("https://graph.facebook.com/{$version}/{$account->external_id}/media", $containerParams);
        if (! $createResp->successful() || ! ($creationId = $createResp->json('id'))) {
            $msg = $createResp->json('error.message') ?: 'Failed to create Instagram media container.';
            throw new RuntimeException($msg);
        }

        // Poll container status until FINISHED (especially required for Reels/video).
        for ($i = 0; $i < 15; $i++) {
            $statusResp = Http::get("https://graph.facebook.com/{$version}/{$creationId}", [
                'fields' => 'status_code',
                'access_token' => $account->access_token,
            ]);
            $code = $statusResp->json('status_code');
            if ($code === 'FINISHED') {
                break;
            }
            if ($code === 'ERROR') {
                throw new RuntimeException('Instagram rejected or failed to process the media file.');
            }
            sleep(3);
        }

        $publishResp = Http::post("https://graph.facebook.com/{$version}/{$account->external_id}/media_publish", [
            'creation_id' => $creationId,
            'access_token' => $account->access_token,
        ]);

        if (! $publishResp->successful() || ! ($mediaId = $publishResp->json('id'))) {
            $msg = $publishResp->json('error.message') ?: 'Failed to publish Instagram post.';
            throw new RuntimeException($msg);
        }

        $permalinkResp = Http::get("https://graph.facebook.com/{$version}/{$mediaId}", [
            'fields' => 'permalink',
            'access_token' => $account->access_token,
        ]);

        $content->forceFill([
            'instagram_media_id' => $mediaId,
            'published_url' => $permalinkResp->successful() ? ($permalinkResp->json('permalink') ?: null) : null,
            'status' => 'published',
            'published_at' => now(),
        ])->save();

        $this->tryPostFirstComment($content);

        return $content->fresh()->load('account:id,platform,account_name,handle');
    }

    public function publishContentToFacebook(SocialContent $content, GoogleDriveConnection $driveConn): SocialContent
    {
        $account = $content->account;
        if (! $account || $account->platform !== 'facebook' || ! $account->external_id) {
            throw new RuntimeException('Selected content must belong to a connected Facebook Page.');
        }
        if (! $account->access_token) {
            throw new RuntimeException('Facebook Page token is missing. Please reconnect your Facebook Page.');
        }

        $version = config('services.instagram.graph_version', 'v21.0');
        $message = trim((string) ($content->title ? "{$content->title}\n\n" : '').(string) ($content->description ?? ''));
        if (is_array($content->hashtags) && count($content->hashtags) > 0) {
            $tagsLine = implode(' ', array_map(fn ($h) => str_starts_with($h, '#') ? $h : "#{$h}", $content->hashtags));
            $message = trim($message."\n\n".$tagsLine);
        }

        $fileId = $content->drive_file_id ?: $content->drive_thumbnail_file_id;
        $isVideo = (bool) $content->drive_file_id && str_starts_with((string) ($content->drive_mime_type ?? 'video/'), 'video/');

        if ($fileId) {
            $mediaUrl = URL::temporarySignedRoute('social.drive.temp-media', now()->addMinutes(15), [
                'workspaceId' => $content->workspace_id,
                'fileId' => $fileId,
            ]);

            if ($isVideo) {
                $resp = Http::timeout(120)->post("https://graph-video.facebook.com/{$version}/{$account->external_id}/videos", [
                    'file_url' => $mediaUrl,
                    'title' => mb_substr($content->title, 0, 255),
                    'description' => $message,
                    'access_token' => $account->access_token,
                ]);
            } else {
                $resp = Http::timeout(60)->post("https://graph.facebook.com/{$version}/{$account->external_id}/photos", [
                    'url' => $mediaUrl,
                    'caption' => $message,
                    'access_token' => $account->access_token,
                ]);
            }
        } else {
            $resp = Http::post("https://graph.facebook.com/{$version}/{$account->external_id}/feed", [
                'message' => $message,
                'access_token' => $account->access_token,
            ]);
        }

        if (! $resp->successful()) {
            $msg = $resp->json('error.message') ?: 'Failed to publish to Facebook Page.';
            throw new RuntimeException($msg);
        }

        $postId = $resp->json('post_id') ?: $resp->json('id');
        $content->forceFill([
            'published_url' => $postId ? "https://www.facebook.com/{$postId}" : "https://www.facebook.com/{$account->external_id}",
            'status' => 'published',
            'published_at' => now(),
        ])->save();

        $this->tryPostFirstComment($content, $postId);

        return $content->fresh()->load('account:id,platform,account_name,handle');
    }

    protected function tryPostFirstComment(SocialContent $content, ?string $fbPostId = null): void
    {
        if (! trim((string) $content->first_comment)) {
            return;
        }

        try {
            $this->postOrUpdateFirstComment($content, $fbPostId);
        } catch (\Throwable $e) {
            $content->forceFill(['first_comment_error' => $e->getMessage()])->save();
        }
    }

    /**
     * Post or update the first comment on a published YouTube, Instagram, or Facebook post.
     * Note: YouTube/Instagram/Facebook public APIs do not expose a comment-pinning endpoint.
     */
    public function postOrUpdateFirstComment(SocialContent $content, ?string $fbPostId = null): SocialContent
    {
        $text = trim((string) $content->first_comment);
        if ($text === '') {
            throw new RuntimeException('First comment text cannot be empty.');
        }

        $account = $content->account;
        if (! $account || ! $account->access_token) {
            throw new RuntimeException('Connected account token is missing.');
        }

        $version = config('services.instagram.graph_version', 'v21.0');
        $commentId = $content->first_comment_id;

        if ($account->platform === 'youtube') {
            if (! $content->youtube_video_id) {
                throw new RuntimeException('YouTube video is not published yet.');
            }
            $ytToken = $this->socialSync->getFreshYouTubeToken($account);
            if (! $ytToken) {
                throw new RuntimeException('YouTube token expired. Please reconnect your channel.');
            }

            if ($commentId) {
                $resp = Http::withToken($ytToken)->put('https://www.googleapis.com/youtube/v3/comments?part=snippet', [
                    'id' => $commentId,
                    'snippet' => ['textOriginal' => $text],
                ]);
                if (! $resp->successful()) {
                    throw new RuntimeException($resp->json('error.message') ?: 'Failed to update YouTube comment.');
                }
            } else {
                $resp = Http::withToken($ytToken)->post('https://www.googleapis.com/youtube/v3/commentThreads?part=snippet', [
                    'snippet' => [
                        'videoId' => $content->youtube_video_id,
                        'topLevelComment' => [
                            'snippet' => ['textOriginal' => $text],
                        ],
                    ],
                ]);
                if (! $resp->successful()) {
                    throw new RuntimeException($resp->json('error.message') ?: 'Failed to post YouTube comment (ensure youtube.force-ssl permission is granted).');
                }
                $commentId = $resp->json('snippet.topLevelComment.id') ?: $resp->json('id');
            }
        } elseif ($account->platform === 'instagram') {
            if (! $content->instagram_media_id) {
                throw new RuntimeException('Instagram post is not published yet.');
            }
            if ($commentId) {
                Http::delete("https://graph.facebook.com/{$version}/{$commentId}", [
                    'access_token' => $account->access_token,
                ]);
            }
            $resp = Http::post("https://graph.facebook.com/{$version}/{$content->instagram_media_id}/comments", [
                'message' => $text,
                'access_token' => $account->access_token,
            ]);
            if (! $resp->successful()) {
                throw new RuntimeException($resp->json('error.message') ?: 'Failed to post Instagram comment.');
            }
            $commentId = $resp->json('id');
        } elseif ($account->platform === 'facebook') {
            $postId = $fbPostId;
            if (! $postId && $content->published_url && preg_match('/facebook\.com\/([^\/\?]+)/', $content->published_url, $m)) {
                $postId = $m[1];
            }
            if (! $postId) {
                throw new RuntimeException('Facebook post ID not found.');
            }

            if ($commentId) {
                $resp = Http::post("https://graph.facebook.com/{$version}/{$commentId}", [
                    'message' => $text,
                    'access_token' => $account->access_token,
                ]);
                if (! $resp->successful()) {
                    throw new RuntimeException($resp->json('error.message') ?: 'Failed to update Facebook comment.');
                }
            } else {
                $resp = Http::post("https://graph.facebook.com/{$version}/{$postId}/comments", [
                    'message' => $text,
                    'access_token' => $account->access_token,
                ]);
                if (! $resp->successful()) {
                    throw new RuntimeException($resp->json('error.message') ?: 'Failed to post Facebook comment.');
                }
                $commentId = $resp->json('id');
            }
        }

        $content->forceFill([
            'first_comment_id' => $commentId,
            'first_comment_error' => null,
        ])->save();

        return $content->fresh()->load('account:id,platform,account_name,handle');
    }

    /**
     * Publish a Content Planner item immediately to its target platform,
     * clearing publish_error on success or recording it on failure.
     */
    public function publishContent(SocialContent $content, string $privacyStatus = 'public'): SocialContent
    {
        $content->loadMissing('account');
        $account = $content->account;
        if (! $account) {
            throw new RuntimeException('Target social account not found.');
        }

        $alreadyPublished = ($account->platform === 'youtube' && ! empty($content->youtube_video_id))
            || ($account->platform === 'instagram' && ! empty($content->instagram_media_id))
            || ($account->platform === 'facebook' && $content->status === 'published' && ! empty($content->published_url));

        if ($alreadyPublished) {
            throw new RuntimeException('Content is already published.');
        }

        $driveConn = GoogleDriveConnection::withoutGlobalScopes()
            ->where('workspace_id', $content->workspace_id)
            ->first();

        try {
            if ($account->platform === 'youtube') {
                if (! $driveConn) {
                    throw new RuntimeException('Google Drive is not connected.');
                }
                $updated = $this->publishContentToYouTube($content, $driveConn, $privacyStatus);
            } elseif ($account->platform === 'instagram') {
                if (! $driveConn) {
                    throw new RuntimeException('Google Drive is not connected.');
                }
                $updated = $this->publishContentToInstagram($content, $driveConn);
            } elseif ($account->platform === 'facebook') {
                $hasMedia = (bool) ($content->drive_file_id ?: $content->drive_thumbnail_file_id);
                if ($hasMedia && ! $driveConn) {
                    throw new RuntimeException('Google Drive is not connected for attached media.');
                }
                $updated = $this->publishContentToFacebook($content, $driveConn ?? new GoogleDriveConnection());
            } else {
                throw new RuntimeException("Unsupported platform for publishing: {$account->platform}");
            }

            $updated->forceFill(['publish_error' => null])->save();

            return $updated->fresh()->load('account:id,platform,account_name,handle');
        } catch (Throwable $e) {
            $content->forceFill(['publish_error' => $e->getMessage()])->save();
            throw $e;
        }
    }
}
