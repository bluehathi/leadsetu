<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Routing\Controllers\Middleware;

/**
 * Maps the standard resource actions onto a model policy through the `can`
 * middleware (Laravel 11+ replacement for authorizeResource()). Declare
 * `implements HasMiddleware` and return this from middleware().
 */
trait AppliesResourcePolicy
{
    /** @return Middleware[] */
    protected static function resourcePolicy(string $model, string $routeParameter): array
    {
        return [
            new Middleware("can:viewAny,$model", only: ['index']),
            new Middleware("can:view,$routeParameter", only: ['show']),
            new Middleware("can:create,$model", only: ['store']),
            new Middleware("can:update,$routeParameter", only: ['update']),
            new Middleware("can:delete,$routeParameter", only: ['destroy']),
        ];
    }
}
