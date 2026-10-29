<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BrevoWebhookController;
use App\Http\Controllers\Api\V1;
use App\Http\Controllers\Api\ProspectListController;
use App\Http\Controllers\Api\EmailCampaignController;
use App\Http\Controllers\Api\ActivityLogController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Versioned API consumed by the SPA (Sanctum cookie auth).
Route::prefix('v1')->group(function () {
    Route::post('auth/login', [V1\AuthController::class, 'login'])->middleware('throttle:6,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [V1\AuthController::class, 'logout']);
        Route::get('me', [V1\AuthController::class, 'me']);
        Route::get('me/settings', [V1\PreferencesController::class, 'show']);
        Route::put('me/settings', [V1\PreferencesController::class, 'update']);
        Route::get('workspace', [V1\WorkspaceController::class, 'show']);
        Route::put('workspace', [V1\WorkspaceController::class, 'update']);
        Route::get('settings/smtp', [V1\SmtpSettingsController::class, 'show']);
        Route::put('settings/smtp', [V1\SmtpSettingsController::class, 'update']);
        Route::post('settings/smtp/test', [V1\SmtpSettingsController::class, 'test'])->middleware('throttle:3,1');
        Route::patch('leads/{lead}/status', [V1\LeadController::class, 'updateStatus']);
        Route::apiResource('leads', V1\LeadController::class);
        Route::apiResource('users', V1\UserController::class);
        Route::apiResource('roles', V1\RoleController::class);
        Route::get('permissions', [V1\PermissionController::class, 'index']);
        Route::apiResource('companies', V1\CompanyController::class);
        Route::apiResource('contacts', V1\ContactController::class);
    });
});

Route::post('webhooks/brevo', [BrevoWebhookController::class, 'handle']);

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('prospect-lists', ProspectListController::class);
    Route::apiResource('email-campaigns', EmailCampaignController::class);
    Route::apiResource('activity-logs', ActivityLogController::class);
});
