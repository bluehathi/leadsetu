<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\McpToken;
use App\Services\McpServerService;
use App\Support\WorkspaceContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Throwable;

class McpController extends Controller
{
    public function __construct(
        protected McpServerService $mcp,
    ) {
    }

    public function info(): JsonResponse
    {
        return response()->json([
            'name' => 'LeadSetu Readonly MCP',
            'version' => '1.0.0',
            'protocol' => 'MCP Streamable HTTP (JSON-RPC 2.0)',
            'auth' => 'Bearer token required in Authorization header',
        ]);
    }

    public function handle(Request $request): JsonResponse|Response
    {
        $plainToken = $request->bearerToken();
        if (! $plainToken) {
            $metaUrl = rtrim((string) config('app.url'), '/').'/.well-known/oauth-protected-resource';
            return response()->json([
                'jsonrpc' => '2.0',
                'id' => $request->input('id'),
                'error' => ['code' => -32001, 'message' => 'Missing Bearer token.'],
            ], 401)->header('WWW-Authenticate', "Bearer resource_metadata=\"{$metaUrl}\"");
        }

        $token = McpToken::withoutGlobalScopes()
            ->where('token_hash', hash('sha256', $plainToken))
            ->first();

        if (! $token || ($token->expires_at && $token->expires_at->isPast())) {
            return response()->json([
                'jsonrpc' => '2.0',
                'id' => $request->input('id'),
                'error' => ['code' => -32001, 'message' => 'Invalid or expired MCP token.'],
            ], 401);
        }

        $token->forceFill(['last_used_at' => now()])->save();

        $payload = $request->all();
        $method = $payload['method'] ?? null;
        $id = $payload['id'] ?? null;
        $params = $payload['params'] ?? [];

        if ($method === 'notifications/initialized' || ($id === null && str_starts_with((string) $method, 'notifications/'))) {
            return response()->noContent(202);
        }

        try {
            $result = WorkspaceContext::run($token->workspace_id, function () use ($method, $params) {
                return match ($method) {
                    'initialize' => [
                        'protocolVersion' => '2025-03-26',
                        'capabilities' => [
                            'tools' => ['listChanged' => false],
                        ],
                        'serverInfo' => [
                            'name' => 'LeadSetu Readonly MCP',
                            'version' => '1.0.0',
                        ],
                    ],
                    'ping' => (object) [],
                    'tools/list' => [
                        'tools' => $this->mcp->tools(),
                    ],
                    'tools/call' => [
                        'content' => $this->mcp->callTool(
                            (string) ($params['name'] ?? ''),
                            is_array($params['arguments'] ?? null) ? $params['arguments'] : [],
                        ),
                    ],
                    default => throw new \BadMethodCallException("Unsupported MCP method: {$method}"),
                };
            });

            return response()->json([
                'jsonrpc' => '2.0',
                'id' => $id,
                'result' => $result,
            ]);
        } catch (\BadMethodCallException $e) {
            return response()->json([
                'jsonrpc' => '2.0',
                'id' => $id,
                'error' => ['code' => -32601, 'message' => $e->getMessage()],
            ], 404);
        } catch (Throwable $e) {
            return response()->json([
                'jsonrpc' => '2.0',
                'id' => $id,
                'error' => ['code' => -32602, 'message' => $e->getMessage()],
            ], 400);
        }
    }
}
