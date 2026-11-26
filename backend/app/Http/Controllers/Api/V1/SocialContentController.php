<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\AppliesResourcePolicy;
use App\Http\Controllers\Controller;
use App\Http\Requests\Social\OptimizeContentRequest;
use App\Http\Requests\Social\StoreSocialContentRequest;
use App\Http\Requests\Social\UpdateSocialContentRequest;
use App\Models\SocialContent;
use App\Services\ActivityLogService;
use App\Services\SocialGrowthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Support\Facades\Gate;

class SocialContentController extends Controller implements HasMiddleware
{
    use AppliesResourcePolicy;

    public function __construct(
        protected SocialGrowthService $growth,
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
}
