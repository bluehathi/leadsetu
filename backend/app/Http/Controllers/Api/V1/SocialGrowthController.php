<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Social\AnalyzeKeywordRequest;
use App\Http\Requests\Social\GenerateIdeasRequest;
use App\Http\Requests\Social\StoreCompetitorRequest;
use App\Models\SocialAccount;
use App\Models\SocialCompetitor;
use App\Models\SocialIdea;
use App\Models\SocialKeyword;
use App\Services\SocialGrowthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class SocialGrowthController extends Controller
{
    public function __construct(protected SocialGrowthService $growth)
    {
    }

    public function keywords(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', SocialKeyword::class);

        $query = SocialKeyword::query()->with('account:id,platform,account_name,handle');
        if ($platform = $request->query('platform')) {
            $query->where('platform', $platform);
        }

        return response()->json(['data' => $query->latest()->get()]);
    }

    public function analyzeKeyword(AnalyzeKeywordRequest $request): JsonResponse
    {
        Gate::authorize('create', SocialKeyword::class);

        $data = $request->validated();
        $keyword = $this->growth->analyzeKeyword(
            $data['keyword'],
            $data['platform'],
            $data['social_account_id'] ?? null,
        );

        return response()->json(['data' => $keyword], 201);
    }

    public function destroyKeyword(SocialKeyword $socialKeyword): JsonResponse
    {
        Gate::authorize('delete', $socialKeyword);
        $socialKeyword->delete();

        return response()->json(null, 204);
    }

    public function competitors(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', SocialCompetitor::class);

        $query = SocialCompetitor::query()->with('account:id,platform,account_name,handle');
        if ($platform = $request->query('platform')) {
            $query->where('platform', $platform);
        }

        return response()->json(['data' => $query->latest()->get()]);
    }

    public function storeCompetitor(StoreCompetitorRequest $request): JsonResponse
    {
        Gate::authorize('create', SocialCompetitor::class);

        $competitor = SocialCompetitor::create(array_merge(
            $request->validated(),
            ['last_checked_at' => now()],
        ));

        return response()->json(['data' => $competitor], 201);
    }

    public function destroyCompetitor(SocialCompetitor $socialCompetitor): JsonResponse
    {
        Gate::authorize('delete', $socialCompetitor);
        $socialCompetitor->delete();

        return response()->json(null, 204);
    }

    public function ideas(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', SocialIdea::class);

        $query = SocialIdea::query()->with('account:id,platform,account_name,handle');
        if ($platform = $request->query('platform')) {
            $query->where('platform', $platform);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json(['data' => $query->latest()->get()]);
    }

    public function generateIdeas(GenerateIdeasRequest $request): JsonResponse
    {
        Gate::authorize('create', SocialIdea::class);

        $data = $request->validated();
        $account = isset($data['social_account_id'])
            ? SocialAccount::findOrFail($data['social_account_id'])
            : null;

        $ideas = $this->growth->generateIdeas(
            $account,
            $data['platform'] ?? null,
            $data['niche'] ?? null,
        );

        return response()->json(['data' => $ideas], 201);
    }

    public function updateIdeaStatus(Request $request, SocialIdea $socialIdea): JsonResponse
    {
        Gate::authorize('update', $socialIdea);

        $validated = $request->validate([
            'status' => ['required', Rule::in(SocialIdea::STATUSES)],
        ]);

        $socialIdea->update($validated);

        return response()->json(['data' => $socialIdea->fresh()]);
    }

    public function convertIdea(Request $request, SocialIdea $socialIdea): JsonResponse
    {
        Gate::authorize('update', $socialIdea);

        $workspaceId = $request->user()?->workspace_id;
        $validated = $request->validate([
            'social_account_id' => [
                'required',
                'integer',
                Rule::exists('social_accounts', 'id')->where('workspace_id', $workspaceId),
            ],
        ]);

        $content = $this->growth->convertIdeaToDraft($socialIdea, (int) $validated['social_account_id']);

        return response()->json(['data' => $content], 201);
    }
}
