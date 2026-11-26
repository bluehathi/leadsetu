<?php

use App\Http\Controllers\Api\McpOAuthController;
use App\Http\Controllers\UnsubscribeController;
use Illuminate\Support\Facades\Route;

// MCP OAuth 2.1 Discovery endpoints (RFC 9728 / RFC 8414)
Route::get('/.well-known/oauth-protected-resource', [McpOAuthController::class, 'protectedResourceMetadata']);
Route::get('/.well-known/oauth-protected-resource/{any}', [McpOAuthController::class, 'protectedResourceMetadata'])->where('any', '.*');
Route::get('/.well-known/oauth-authorization-server', [McpOAuthController::class, 'authorizationServerMetadata']);

// The backend is API-only (see routes/api.php). The few web routes below serve links that
// are opened from outside the SPA.

// Signed one-click unsubscribe link from campaign emails.
Route::get('/unsubscribe/{contact}', UnsubscribeController::class)
    ->middleware('signed')->name('contacts.unsubscribe');

// Anything that still lands on the API host in a browser is sent to the app. The named
// "login" route also keeps Laravel's guest redirect from failing on non-API requests.
Route::get('/', fn () => redirect()->away(rtrim(config('app.frontend_url'), '/') . '/'));
Route::get('/login', fn () => redirect()->away(rtrim(config('app.frontend_url'), '/') . '/login'))->name('login');
