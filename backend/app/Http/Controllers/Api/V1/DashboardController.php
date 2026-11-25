<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request, DashboardService $dashboard): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->workspace_id !== null && $user->can('view_dashboard'), 403);

        return response()->json(['data' => $dashboard->build($user)]);
    }
}
