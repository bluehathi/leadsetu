<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\SocialBrand;
use App\Services\ActivityLogService;
use App\Services\SocialOAuthSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class SocialBrandController extends Controller
{
    public function __construct(
        protected SocialOAuthSyncService $oauthSync,
        protected ActivityLogService $audit,
    ) {
    }

    public function index(): JsonResponse
    {
        Gate::authorize('viewAny', SocialAccount::class);

        $brands = SocialBrand::query()
            ->with('accounts:id,social_brand_id,platform,account_name,handle,avatar_url,followers_count,views_count,engagement_rate,status')
            ->orderBy('name')
            ->get()
            ->map(function (SocialBrand $brand) {
                $arr = $brand->toArray();
                $arr['total_followers'] = $brand->accounts->sum('followers_count');
                $arr['total_views'] = $brand->accounts->sum('views_count');
                $arr['channels_count'] = $brand->accounts->count();
                return $arr;
            });

        return response()->json(['data' => $brands]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', SocialAccount::class);

        $workspaceId = $request->user()?->workspace_id;
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'niche' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'account_ids' => ['sometimes', 'array'],
            'account_ids.*' => [
                'integer',
                Rule::exists('social_accounts', 'id')->where('workspace_id', $workspaceId),
            ],
        ]);

        $brand = SocialBrand::create([
            'name' => $validated['name'],
            'niche' => $validated['niche'] ?? null,
            'description' => $validated['description'] ?? null,
        ]);

        if (! empty($validated['account_ids'])) {
            SocialAccount::whereIn('id', $validated['account_ids'])
                ->update(['social_brand_id' => $brand->id]);
        }

        $this->audit->log('social_brand_created', $brand, "Created social brand {$brand->name}");

        return response()->json([
            'data' => $brand->load('accounts:id,social_brand_id,platform,account_name,handle,avatar_url,followers_count,views_count,engagement_rate,status'),
        ], 201);
    }

    public function update(Request $request, SocialBrand $socialBrand): JsonResponse
    {
        Gate::authorize('create', SocialAccount::class);

        $workspaceId = $request->user()?->workspace_id;
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'niche' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'account_ids' => ['sometimes', 'array'],
            'account_ids.*' => [
                'integer',
                Rule::exists('social_accounts', 'id')->where('workspace_id', $workspaceId),
            ],
        ]);

        $socialBrand->update([
            'name' => $validated['name'] ?? $socialBrand->name,
            'niche' => array_key_exists('niche', $validated) ? $validated['niche'] : $socialBrand->niche,
            'description' => array_key_exists('description', $validated) ? $validated['description'] : $socialBrand->description,
        ]);

        if (array_key_exists('account_ids', $validated)) {
            SocialAccount::where('social_brand_id', $socialBrand->id)->update(['social_brand_id' => null]);
            if (count($validated['account_ids']) > 0) {
                SocialAccount::whereIn('id', $validated['account_ids'])->update(['social_brand_id' => $socialBrand->id]);
            }
        }

        $this->audit->log('social_brand_updated', $socialBrand, "Updated social brand {$socialBrand->name}");

        return response()->json([
            'data' => $socialBrand->fresh()->load('accounts:id,social_brand_id,platform,account_name,handle,avatar_url,followers_count,views_count,engagement_rate,status'),
        ]);
    }

    public function destroy(SocialBrand $socialBrand): JsonResponse
    {
        Gate::authorize('create', SocialAccount::class);

        $name = $socialBrand->name;
        $socialBrand->delete();
        $this->audit->log('social_brand_deleted', $socialBrand, "Deleted social brand {$name}");

        return response()->json(null, 204);
    }

    public function analytics(Request $request, SocialBrand $socialBrand): JsonResponse
    {
        Gate::authorize('viewAny', SocialAccount::class);

        $forceRefresh = $request->boolean('refresh');
        $accounts = $socialBrand->accounts()->get();

        $channels = [];
        $allItems = [];
        $totalFollowers = 0;
        $totalViews = 0;
        $totalPosts = 0;
        $engSum = 0;

        foreach ($accounts as $acc) {
            $data = $this->oauthSync->getChannelAnalytics($acc, $forceRefresh);
            $summary = $data['summary'] ?? [];
            $followers = (int) ($summary['followers_count'] ?? $acc->followers_count);
            $views = (int) ($summary['views_count'] ?? $acc->views_count);
            $posts = (int) ($summary['posts_count'] ?? $acc->posts_count);
            $eng = (float) ($summary['engagement_rate'] ?? $acc->engagement_rate);

            $totalFollowers += $followers;
            $totalViews += $views;
            $totalPosts += $posts;
            $engSum += $eng;

            $channels[] = [
                'account' => $acc,
                'summary' => $summary,
                'source' => $data['source'] ?? 'cache',
                'synced_at' => $data['synced_at'] ?? null,
                'deep_analytics' => $data['deep_analytics'] ?? null,
            ];

            foreach (($data['recent_items'] ?? []) as $item) {
                $item['account_id'] = $acc->id;
                $item['account_name'] = $acc->account_name;
                $item['platform'] = $acc->platform;
                $allItems[] = $item;
            }
        }

        usort($allItems, fn ($a, $b) => ($b['views'] + $b['likes']) <=> ($a['views'] + $a['likes']));

        return response()->json([
            'data' => [
                'brand' => $socialBrand,
                'totals' => [
                    'channels_count' => count($channels),
                    'followers_count' => $totalFollowers,
                    'views_count' => $totalViews,
                    'posts_count' => $totalPosts,
                    'avg_engagement_rate' => count($channels) > 0 ? round($engSum / count($channels), 2) : 0,
                ],
                'channels' => $channels,
                'top_items' => array_slice($allItems, 0, 12),
                'source' => $forceRefresh ? 'live' : 'cache',
            ],
        ]);
    }
}
