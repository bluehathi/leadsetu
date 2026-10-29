<?php

namespace App\Support;

use Closure;

/**
 * Explicit tenant context for code that runs without an authenticated user
 * (queue jobs, scheduled commands). HTTP requests resolve the tenant from the
 * authenticated user instead; see WorkSpaceScope.
 */
class WorkspaceContext
{
    protected static ?int $workspaceId = null;

    public static function id(): ?int
    {
        return static::$workspaceId;
    }

    public static function run(int $workspaceId, Closure $callback): mixed
    {
        $previous = static::$workspaceId;
        static::$workspaceId = $workspaceId;

        try {
            return $callback();
        } finally {
            static::$workspaceId = $previous;
        }
    }
}
