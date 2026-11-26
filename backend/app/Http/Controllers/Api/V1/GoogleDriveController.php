<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\GoogleDriveConnection;
use App\Models\SocialAccount;
use App\Models\SocialContent;
use App\Services\ActivityLogService;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
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
                'connected_at' => $conn->updated_at?->toIso8601String(),
            ] : [
                'connected' => false,
                'google_email' => null,
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
            );

            return response()->json(['data' => $files]);
        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function disconnect(): JsonResponse
    {
        Gate::authorize('create', SocialAccount::class);

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
