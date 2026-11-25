<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Read-only: the audit trail cannot be edited or deleted through the API. */
class ActivityLogController extends Controller
{
    public function __construct(protected ActivityLogService $logs)
    {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', ActivityLog::class);

        $filters = $request->validate([
            'user_id' => 'nullable|integer',
            'action' => 'nullable|string|max:100',
            'entity' => 'nullable|string|max:100',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        return ActivityLogResource::collection($this->logs->paginate($filters, (int) $request->integer('per_page', 20)));
    }

    public function filters(): JsonResponse
    {
        $this->authorize('viewAny', ActivityLog::class);

        return response()->json(['data' => $this->logs->filterOptions()]);
    }
}
