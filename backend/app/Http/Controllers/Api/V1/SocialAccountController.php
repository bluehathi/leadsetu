<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\AppliesResourcePolicy;
use App\Http\Controllers\Controller;
use App\Http\Requests\Social\StoreSocialAccountRequest;
use App\Http\Requests\Social\UpdateSocialAccountRequest;
use App\Models\SocialAccount;
use App\Services\ActivityLogService;
use App\Services\GoogleDriveService;
use App\Services\SocialGrowthService;
use App\Services\SocialOAuthSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Support\Facades\Gate;
use Throwable;

class SocialAccountController extends Controller implements HasMiddleware
{
    use AppliesResourcePolicy;

    public function __construct(
        protected SocialGrowthService $growth,
        protected SocialOAuthSyncService $oauthSync,
        protected GoogleDriveService $drive,
        protected ActivityLogService $audit,
    ) {
    }

    public static function middleware(): array
    {
        return static::resourcePolicy(SocialAccount::class, 'social_account');
    }

    public function overview(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', SocialAccount::class);

        return response()->json([
            'data' => $this->growth->overview($request->query('platform')),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = SocialAccount::query()->with('brand:id,name,niche')->withCount('contents');

        if ($platform = $request->query('platform')) {
            $query->where('platform', $platform);
        }
        if ($brandId = $request->query('social_brand_id')) {
            $query->where('social_brand_id', $brandId);
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('account_name', 'like', "%{$search}%")
                    ->orWhere('handle', 'like', "%{$search}%")
                    ->orWhere('niche', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'data' => $query->latest()->get(),
        ]);
    }

    public function store(StoreSocialAccountRequest $request): JsonResponse
    {
        $account = SocialAccount::create(array_merge(
            $request->validated(),
            ['last_synced_at' => now()],
        ));

        $this->audit->log('social_account_connected', $account, "Connected {$account->platform} account {$account->handle}");

        return response()->json(['data' => $account], 201);
    }

    public function show(SocialAccount $socialAccount): JsonResponse
    {
        return response()->json([
            'data' => $socialAccount->load(['contents' => fn ($q) => $q->latest()->limit(10)]),
        ]);
    }

    public function analytics(Request $request, SocialAccount $socialAccount): JsonResponse
    {
        Gate::authorize('view', $socialAccount);

        return response()->json([
            'data' => $this->oauthSync->getChannelAnalytics($socialAccount, $request->boolean('refresh')),
        ]);
    }

    public function videoAnalytics(Request $request, SocialAccount $socialAccount, string $videoId): JsonResponse
    {
        Gate::authorize('view', $socialAccount);

        try {
            return response()->json([
                'data' => $this->oauthSync->getMediaAnalytics($socialAccount, $videoId, $request->boolean('refresh')),
            ]);
        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function update(UpdateSocialAccountRequest $request, SocialAccount $socialAccount): JsonResponse
    {
        $socialAccount->update($request->validated());
        $this->audit->log('social_account_updated', $socialAccount, "Updated {$socialAccount->platform} account {$socialAccount->handle}");

        return response()->json(['data' => $socialAccount->fresh()]);
    }

    public function sync(SocialAccount $socialAccount): JsonResponse
    {
        Gate::authorize('update', $socialAccount);

        $synced = $this->oauthSync->syncAccount($socialAccount);
        $this->audit->log('social_account_synced', $synced, "Synced {$synced->platform} account {$synced->handle}");

        return response()->json(['data' => $synced]);
    }

    public function syncAll(): JsonResponse
    {
        Gate::authorize('viewAny', SocialAccount::class);

        $synced = SocialAccount::query()
            ->where('status', 'connected')
            ->get()
            ->map(fn (SocialAccount $account) => $this->oauthSync->syncAccount($account));

        return response()->json(['data' => $synced]);
    }

    public function oauthUrl(Request $request, string $platform): JsonResponse
    {
        Gate::authorize('create', SocialAccount::class);

        try {
            $url = $this->oauthSync->getAuthUrl($platform, $request->user());
            return response()->json(['data' => ['url' => $url]]);
        } catch (Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function oauthCallback(Request $request, string $platform): RedirectResponse
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

        if ($request->filled('error')) {
            return redirect()->away("{$frontendUrl}/social?oauth_error=".urlencode((string) $request->query('error')));
        }

        try {
            $state = (string) $request->query('state');
            $code = (string) $request->query('code');

            if ($platform === 'youtube' && $this->drive->isDriveState($state)) {
                $this->drive->handleCallback($code, $state);
                return redirect()->away("{$frontendUrl}/social?tab=drive&drive_connected=1");
            }

            $accounts = $this->oauthSync->handleCallback($platform, $code, $state);

            return redirect()->away("{$frontendUrl}/social?connected={$platform}&count=".count($accounts));
        } catch (Throwable $e) {
            return redirect()->away("{$frontendUrl}/social?oauth_error=".urlencode($e->getMessage()));
        }
    }

    public function destroy(SocialAccount $socialAccount): JsonResponse
    {
        $handle = $socialAccount->handle;
        $platform = $socialAccount->platform;
        $socialAccount->delete();
        $this->audit->log('social_account_disconnected', $socialAccount, "Removed {$platform} account {$handle}");

        return response()->json(null, 204);
    }
}
