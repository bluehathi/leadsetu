<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\McpToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class McpTokenController extends Controller
{
    public function index(): JsonResponse
    {
        Gate::authorize('view', request()->user()->workspace);

        $tokens = McpToken::query()
            ->latest()
            ->get(['id', 'name', 'token_prefix', 'last_used_at', 'expires_at', 'created_at']);

        return response()->json([
            'data' => [
                'endpoint' => url('/api/mcp'),
                'tokens' => $tokens,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('update', $request->user()->workspace);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $plainToken = 'lsmcp_'.Str::random(48);

        $token = new McpToken([
            'name' => $validated['name'],
            'scopes' => ['readonly'],
        ]);
        $token->forceFill([
            'user_id' => $request->user()->id,
            'token_hash' => hash('sha256', $plainToken),
            'token_prefix' => substr($plainToken, 0, 14),
        ]);
        $token->save();

        return response()->json([
            'data' => [
                'token' => [
                    'id' => $token->id,
                    'name' => $token->name,
                    'token_prefix' => $token->token_prefix,
                    'created_at' => $token->created_at?->toIso8601String(),
                ],
                'plain_text_token' => $plainToken,
                'endpoint' => url('/api/mcp'),
            ],
        ], 201);
    }

    public function destroy(McpToken $mcpToken): JsonResponse
    {
        Gate::authorize('update', request()->user()->workspace);

        $mcpToken->delete();

        return response()->json(null, 204);
    }
}
