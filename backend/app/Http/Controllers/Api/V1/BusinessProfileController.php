<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\SaveBusinessProfileRequest;
use App\Http\Resources\BusinessProfileResource;
use App\Models\BusinessProfile;
use App\Services\ActivityLogService;
use App\Services\BusinessProfileService;
use Illuminate\Http\JsonResponse;

class BusinessProfileController extends Controller
{
    public function __construct(protected BusinessProfileService $business, protected ActivityLogService $audit)
    {
    }

    /** `data` is null until the business has been set up. */
    public function show(): JsonResponse
    {
        $this->authorize('view', BusinessProfile::class);
        $profile = $this->business->current();

        return response()->json(['data' => $profile ? (new BusinessProfileResource($profile))->resolve() : null]);
    }

    public function update(SaveBusinessProfileRequest $request): JsonResponse
    {
        $profile = $this->business->save($request->validated());
        $this->audit->log('business_profile_updated', $profile, 'Business profile updated', ['country' => $profile->country]);

        // Upsert of a singleton: always 200.
        return (new BusinessProfileResource($profile))->response()->setStatusCode(200);
    }
}
