<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\GoogleDriveConnection;
use App\Models\GoogleDriveFile;
use App\Models\SocialAccount;
use App\Models\SocialContent;
use App\Services\ActivityLogService;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Throwable;

class GoogleDriveController extends Controller
{
    public function __construct(
        protected GoogleDriveService $drive,
        protected ActivityLogService $audit,
    ) {
    }

    public function status(): JsonResponse
    {
        Gate::authorize('viewAny', SocialAccount::class);

        $conn = GoogleDriveConnection::query()->first();

        return response()->json([
            'data' => $conn ? [
                'connected' => true,
                'google_email' => $conn->google_email,
                'default_folder_id' => $conn->default_folder_id,
                'default_folder_name' => $conn->default_folder_name,
                'favorite_folders' => $conn->favorite_folders ?? [],
                'lock_to_default_folder' => (bool) $conn->lock_to_default_folder,
                'connected_at' => $conn->updated_at?->toIso8601String(),
            ] : [
                'connected' => false,
                'google_email' => null,
                'default_folder_id' => null,
                'default_folder_name' => null,
                'favorite_folders' => [],
                'lock_to_default_folder' => false,
            ],
        ]);
    }

    public function toggleFavorite(Request $request): JsonResponse
    {
        Gate::authorize('create', SocialAccount::class);

        $conn = GoogleDriveConnection::query()->first();
        if (! $conn) {
            return response()->json(['message' => 'Google Drive is not connected.'], 422);
        }

        $folderId = (string) $request->input('folder_id');
        $folderName = (string) $request->input('folder_name');
        if (! $folderId || ! $folderName) {
            return response()->json(['message' => 'folder_id and folder_name are required.'], 422);
        }

        $favorites = collect($conn->favorite_folders ?? []);
        $exists = $favorites->contains(fn ($f) => ($f['id'] ?? null) === $folderId);

        if ($exists) {
            $favorites = $favorites->reject(fn ($f) => ($f['id'] ?? null) === $folderId)->values();
            if ($conn->default_folder_id === $folderId) {
                $conn->default_folder_id = null;
                $conn->default_folder_name = null;
            }
        } else {
            $favorites->push(['id' => $folderId, 'name' => $folderName]);
        }

        $conn->favorite_folders = $favorites->all();
        $conn->save();

        return response()->json([
            'data' => [
                'default_folder_id' => $conn->default_folder_id,
                'default_folder_name' => $conn->default_folder_name,
                'favorite_folders' => $conn->favorite_folders ?? [],
            ],
        ]);
    }

    public function setDefaultFolder(Request $request): JsonResponse
    {
        Gate::authorize('create', SocialAccount::class);

        $conn = GoogleDriveConnection::query()->first();
        if (! $conn) {
            return response()->json(['message' => 'Google Drive is not connected.'], 422);
        }

        if ($conn->lock_to_default_folder) {
            return response()->json(['message' => 'Unlock the folder with your portal password before changing the default folder.'], 403);
        }

        $folderId = $request->input('folder_id') ?: null;
        $folderName = $request->input('folder_name') ?: null;

        $conn->default_folder_id = $folderId;
        $conn->default_folder_name = $folderName;
        if (! $folderId) {
            $conn->lock_to_default_folder = false;
        }

        if ($folderId && $folderName) {
            $favorites = collect($conn->favorite_folders ?? []);
            if (! $favorites->contains(fn ($f) => ($f['id'] ?? null) === $folderId)) {
                $favorites->push(['id' => $folderId, 'name' => $folderName]);
                $conn->favorite_folders = $favorites->all();
            }
        }

        $conn->save();

        return response()->json([
            'data' => [
                'default_folder_id' => $conn->default_folder_id,
                'default_folder_name' => $conn->default_folder_name,
                'favorite_folders' => $conn->favorite_folders ?? [],
                'lock_to_default_folder' => (bool) $conn->lock_to_default_folder,
            ],
        ]);
    }

    public function toggleLockFolder(Request $request): JsonResponse
    {
        Gate::authorize('create', SocialAccount::class);

        $conn = GoogleDriveConnection::query()->first();
        if (! $conn) {
            return response()->json(['message' => 'Google Drive is not connected.'], 422);
        }

        $locked = $request->boolean('locked');
        if ($locked && ! $conn->default_folder_id) {
            return response()->json(['message' => 'Set a default folder before locking access.'], 422);
        }

        if (! $locked && $conn->lock_to_default_folder) {
            $password = (string) $request->input('password', '');
            if ($password === '' || ! Hash::check($password, (string) $request->user()?->password)) {
                return response()->json(['message' => 'Incorrect portal password.'], 422);
            }
        }

        $conn->lock_to_default_folder = $locked;
        $conn->save();

        return response()->json([
            'data' => [
                'lock_to_default_folder' => (bool) $conn->lock_to_default_folder,
            ],
        ]);
    }

    public function oauthUrl(Request $request): JsonResponse
    {
        Gate::authorize('create', SocialAccount::class);

        try {
            return response()->json([
                'data' => ['url' => $this->drive->getAuthUrl($request->user())],
            ]);
        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function files(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', SocialAccount::class);

        $conn = GoogleDriveConnection::query()->first();
        if (! $conn) {
            return response()->json(['message' => 'Google Drive is not connected.'], 422);
        }

        try {
            $files = $this->drive->listFiles(
                $conn,
                $request->query('folder_id') ?: null,
                $request->query('search') ?: null,
                $request->boolean('refresh'),
            );

            return response()->json(['data' => $files]);
        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function disconnect(): JsonResponse
    {
        Gate::authorize('create', SocialAccount::class);

        $conn = GoogleDriveConnection::query()->first();
        if ($conn?->lock_to_default_folder) {
            return response()->json(['message' => 'Unlock the folder with your portal password before disconnecting Google Drive.'], 403);
        }

        GoogleDriveFile::query()->delete();
        GoogleDriveConnection::query()->delete();

        return response()->json(null, 204);
    }

    public function publishToYouTube(Request $request, SocialContent $socialContent): JsonResponse
    {
        Gate::authorize('update', $socialContent);

        $conn = GoogleDriveConnection::query()->first();
        if (! $conn) {
            return response()->json(['message' => 'Google Drive is not connected.'], 422);
        }

        $privacy = $request->input('privacy_status', 'private');

        try {
            $updated = $this->drive->publishContentToYouTube($socialContent, $conn, $privacy);
            $this->audit->log('youtube_video_published', $updated, "Published {$updated->title} from Google Drive to YouTube ({$updated->youtube_video_id})");

            return response()->json(['data' => $updated]);
        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
