<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveWorkspace
{
    /**
     * Block API access when the authenticated user's workspace is deactivated.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user && $user->workspace && ! $user->workspace->is_active) {
            return response()->json([
                'message' => 'This workspace has been deactivated.',
            ], 403);
        }

        return $next($request);
    }
}
