<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;

/** When REQUIRE_VERIFIED_EMAIL is on, business endpoints need a verified address (account endpoints stay open). */
class RequireVerifiedEmail
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (config('auth.require_verified_email') && $user instanceof MustVerifyEmail && ! $user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Your email address is not verified.', 'code' => 'email_not_verified'], 409);
        }

        return $next($request);
    }
}
