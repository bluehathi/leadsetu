<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\McpToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class McpOAuthController extends Controller
{
    public function protectedResourceMetadata(): JsonResponse
    {
        $base = rtrim((string) config('app.url'), '/');

        return response()->json([
            'resource' => "{$base}/api/mcp",
            'authorization_servers' => [$base],
            'bearer_methods_supported' => ['header'],
            'scopes_supported' => ['readonly'],
        ]);
    }

    public function authorizationServerMetadata(): JsonResponse
    {
        $base = rtrim((string) config('app.url'), '/');

        return response()->json([
            'issuer' => $base,
            'authorization_endpoint' => "{$base}/mcp/oauth/authorize",
            'token_endpoint' => "{$base}/api/mcp/oauth/token",
            'registration_endpoint' => "{$base}/api/mcp/oauth/register",
            'response_types_supported' => ['code'],
            'grant_types_supported' => ['authorization_code'],
            'code_challenge_methods_supported' => ['S256'],
            'token_endpoint_auth_methods_supported' => ['none', 'client_secret_post'],
            'scopes_supported' => ['readonly'],
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $redirectUris = $request->input('redirect_uris', []);
        if (! is_array($redirectUris) || count($redirectUris) === 0) {
            return response()->json([
                'error' => 'invalid_client_metadata',
                'error_description' => 'redirect_uris must be a non-empty array.',
            ], 400);
        }

        $clientId = 'lsmcp_client_'.Str::random(24);
        $clientName = (string) ($request->input('client_name') ?: 'AI Agent Connector');

        Cache::put("mcp_oauth_client:{$clientId}", [
            'client_id' => $clientId,
            'client_name' => $clientName,
            'redirect_uris' => array_values($redirectUris),
        ], now()->addDays(90));

        return response()->json([
            'client_id' => $clientId,
            'client_name' => $clientName,
            'redirect_uris' => array_values($redirectUris),
            'grant_types' => ['authorization_code'],
            'response_types' => ['code'],
            'token_endpoint_auth_method' => 'none',
        ], 201);
    }

    public function approve(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'string', 'max:255'],
            'redirect_uri' => ['required', 'url', 'max:2000'],
            'state' => ['nullable', 'string', 'max:4096'],
            'code_challenge' => ['nullable', 'string', 'max:512'],
            'code_challenge_method' => ['nullable', 'string', 'max:20'],
        ]);

        $client = Cache::get("mcp_oauth_client:{$validated['client_id']}");
        if ($client && ! in_array($validated['redirect_uri'], $client['redirect_uris'], true)) {
            return response()->json(['message' => 'Invalid redirect_uri for client.'], 422);
        }

        $code = 'lsmcp_code_'.Str::random(40);
        $user = $request->user();

        Cache::put("mcp_oauth_code:{$code}", [
            'user_id' => $user->id,
            'workspace_id' => $user->workspace_id,
            'client_id' => $validated['client_id'],
            'client_name' => $client['client_name'] ?? 'AI Agent Connector',
            'redirect_uri' => $validated['redirect_uri'],
            'code_challenge' => $validated['code_challenge'] ?? null,
            'code_challenge_method' => $validated['code_challenge_method'] ?? 'S256',
        ], now()->addMinutes(10));

        $sep = str_contains($validated['redirect_uri'], '?') ? '&' : '?';
        $redirectTo = $validated['redirect_uri'].$sep.http_build_query(array_filter([
            'code' => $code,
            'state' => $validated['state'] ?? null,
        ], fn ($v) => $v !== null && $v !== ''));

        return response()->json([
            'data' => ['redirect_to' => $redirectTo],
        ]);
    }

    public function token(Request $request): JsonResponse
    {
        if ($request->input('grant_type') !== 'authorization_code') {
            return response()->json(['error' => 'unsupported_grant_type'], 400);
        }

        $code = (string) $request->input('code', '');
        $payload = Cache::pull("mcp_oauth_code:{$code}");
        if (! $payload) {
            return response()->json(['error' => 'invalid_grant', 'error_description' => 'Invalid or expired authorization code.'], 400);
        }

        if ($request->filled('redirect_uri') && $request->input('redirect_uri') !== $payload['redirect_uri']) {
            return response()->json(['error' => 'invalid_grant', 'error_description' => 'redirect_uri mismatch.'], 400);
        }

        if (! empty($payload['code_challenge'])) {
            $verifier = (string) $request->input('code_verifier', '');
            $computed = rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');
            if ($verifier === '' || ! hash_equals($payload['code_challenge'], $computed)) {
                return response()->json(['error' => 'invalid_grant', 'error_description' => 'PKCE verification failed.'], 400);
            }
        }

        $plainToken = 'lsmcp_'.Str::random(48);
        $token = new McpToken([
            'name' => $payload['client_name'],
            'scopes' => ['readonly'],
        ]);
        $token->forceFill([
            'workspace_id' => $payload['workspace_id'],
            'user_id' => $payload['user_id'],
            'token_hash' => hash('sha256', $plainToken),
            'token_prefix' => substr($plainToken, 0, 14),
        ]);
        $token->save();

        return response()->json([
            'access_token' => $plainToken,
            'token_type' => 'Bearer',
            'scope' => 'readonly',
        ]);
    }
}
