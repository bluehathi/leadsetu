<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\AppliesResourcePolicy;
use App\Http\Controllers\Controller;
use App\Http\Requests\Social\OptimizeContentRequest;
use App\Http\Requests\Social\StoreSocialContentRequest;
use App\Http\Requests\Social\UpdateSocialContentRequest;
use App\Models\GoogleDriveConnection;
use App\Models\SocialAccount;
use App\Models\SocialContent;
use App\Services\ActivityLogService;
use App\Services\GoogleDriveService;
use App\Services\SocialGrowthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Throwable;

class SocialContentController extends Controller implements HasMiddleware
{
    use AppliesResourcePolicy;

    public function __construct(
        protected SocialGrowthService $growth,
        protected GoogleDriveService $drive,
        protected ActivityLogService $audit,
    ) {
    }

    public static function middleware(): array
    {
        return static::resourcePolicy(SocialContent::class, 'social_content');
    }

    public function index(Request $request): JsonResponse
    {
        $query = SocialContent::query()->with('account:id,platform,account_name,handle');

        if ($accountId = $request->query('social_account_id')) {
            $query->where('social_account_id', $accountId);
        }
        if ($platform = $request->query('platform')) {
            $query->where('platform', $platform);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json([
            'data' => $query->latest()->get(),
        ]);
    }

    public function store(StoreSocialContentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $scored = $this->growth->scoreContent($data);

        $content = SocialContent::create(array_merge($data, $scored));
        $this->audit->log('social_content_created', $content, "Created {$content->platform} content: {$content->title}");

        return response()->json([
            'data' => $content->load('account:id,platform,account_name,handle'),
        ], 201);
    }

    public function show(SocialContent $socialContent): JsonResponse
    {
        return response()->json([
            'data' => $socialContent->load('account:id,platform,account_name,handle'),
        ]);
    }

    public function update(UpdateSocialContentRequest $request, SocialContent $socialContent): JsonResponse
    {
        $merged = array_merge($socialContent->toArray(), $request->validated());
        $scored = $this->growth->scoreContent($merged);

        $socialContent->update(array_merge($request->validated(), $scored));
        $this->audit->log('social_content_updated', $socialContent, "Updated {$socialContent->platform} content: {$socialContent->title}");

        return response()->json([
            'data' => $socialContent->fresh()->load('account:id,platform,account_name,handle'),
        ]);
    }

    public function optimize(OptimizeContentRequest $request): JsonResponse
    {
        Gate::authorize('create', SocialContent::class);

        return response()->json([
            'data' => $this->growth->optimizeContent($request->validated()),
        ]);
    }

    public function destroy(SocialContent $socialContent): JsonResponse
    {
        $title = $socialContent->title;
        $socialContent->delete();
        $this->audit->log('social_content_deleted', $socialContent, "Deleted social content: {$title}");

        return response()->json(null, 204);
    }

    public function share(Request $request, SocialContent $socialContent): JsonResponse
    {
        Gate::authorize('create', SocialContent::class);

        $workspaceId = $request->user()?->workspace_id;
        $validated = $request->validate([
            'target_account_ids' => ['required', 'array', 'min:1'],
            'target_account_ids.*' => [
                'integer',
                Rule::exists('social_accounts', 'id')->where('workspace_id', $workspaceId),
            ],
            'publish_now' => ['sometimes', 'boolean'],
            'youtube_privacy' => ['sometimes', Rule::in(['private', 'unlisted', 'public'])],
        ]);

        $publishNow = (bool) ($validated['publish_now'] ?? false);
        $ytPrivacy = $validated['youtube_privacy'] ?? 'private';
        $driveConn = GoogleDriveConnection::query()->first();

        $created = [];
        $errors = [];

        foreach (array_unique($validated['target_account_ids']) as $accountId) {
            $target = SocialAccount::find($accountId);
            if (! $target) {
                continue;
            }

            $data = $this->growth->adaptContentForAccount($socialContent, $target);

            $scored = $this->growth->scoreContent($data);
            $clone = SocialContent::create(array_merge($data, $scored));

            if ($publishNow) {
                try {
                    if ($target->platform === 'youtube') {
                        if (! $driveConn) {
                            throw new \RuntimeException('Google Drive is not connected.');
                        }
                        $clone = $this->drive->publishContentToYouTube($clone, $driveConn, $ytPrivacy);
                    } elseif ($target->platform === 'instagram') {
                        if (! $driveConn) {
                            throw new \RuntimeException('Google Drive is not connected.');
                        }
                        $clone = $this->drive->publishContentToInstagram($clone, $driveConn);
                    } elseif ($target->platform === 'facebook') {
                        $clone = $this->drive->publishContentToFacebook($clone, $driveConn ?? new GoogleDriveConnection());
                    }
                } catch (Throwable $e) {
                    $errors[] = "{$target->account_name} ({$target->platform}): {$e->getMessage()}";
                }
            }

            $created[] = $clone->load('account:id,platform,account_name,handle');
        }

        $this->audit->log('social_content_shared', $socialContent, "Shared '{$socialContent->title}' to ".count($created).' channel(s)');

        return response()->json([
            'data' => [
                'created' => $created,
                'errors' => $errors,
            ],
        ], 201);
    }

    public function updateFirstComment(Request $request, SocialContent $socialContent): JsonResponse
    {
        Gate::authorize('update', $socialContent);

        $validated = $request->validate([
            'first_comment' => ['required', 'string', 'max:2000'],
            'pin_first_comment' => ['sometimes', 'boolean'],
        ]);

        $socialContent->update([
            'first_comment' => $validated['first_comment'],
            'pin_first_comment' => $validated['pin_first_comment'] ?? $socialContent->pin_first_comment,
        ]);

        try {
            $updated = $this->drive->postOrUpdateFirstComment($socialContent->fresh());
            $this->audit->log('social_first_comment_updated', $updated, "Updated first comment on '{$updated->title}'");

            return response()->json(['data' => $updated]);
        } catch (Throwable $e) {
            $socialContent->forceFill(['first_comment_error' => $e->getMessage()])->save();
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    protected function mapContentTypeForPlatform(string $type, string $platform): string
    {
        if ($platform === 'youtube') {
            return in_array($type, ['reel', 'short'], true) ? 'short' : 'video';
        }
        if ($platform === 'instagram') {
            return in_array($type, ['short', 'video', 'reel'], true) ? 'reel' : (in_array($type, ['carousel', 'post'], true) ? $type : 'post');
        }

        return in_array($type, ['reel', 'post', 'video'], true) ? $type : 'post';
    }
}
