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
            ->get(['id', 'name', 'token_prefix', 'scopes', 'last_used_at', 'expires_at', 'created_at']);

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
            'allow_content_write' => ['sometimes', 'boolean'],
        ]);

        $plainToken = 'lsmcp_'.Str::random(48);
        $scopes = ! empty($validated['allow_content_write']) ? ['readonly', 'content:write'] : ['readonly'];

        $token = new McpToken([
            'name' => $validated['name'],
            'scopes' => $scopes,
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
                    'scopes' => $token->scopes,
                    'created_at' => $token->created_at?->toIso8601String(),
                ],
                'plain_text_token' => $plainToken,
                'endpoint' => url('/api/mcp'),
            ],
        ], 201);
    }

    public function update(Request $request, McpToken $mcpToken): JsonResponse
    {
        Gate::authorize('update', $request->user()->workspace);

        $validated = $request->validate([
            'allow_content_write' => ['required', 'boolean'],
        ]);

        $mcpToken->scopes = $validated['allow_content_write']
            ? ['readonly', 'content:write']
            : ['readonly'];
        $mcpToken->save();

        return response()->json([
            'data' => $mcpToken->only(['id', 'name', 'token_prefix', 'scopes', 'last_used_at', 'created_at']),
        ]);
    }

    public function destroy(McpToken $mcpToken): JsonResponse
    {
        Gate::authorize('update', request()->user()->workspace);

        $mcpToken->delete();

        return response()->json(null, 204);
    }
}
