<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BrevoWebhookController;
use App\Http\Controllers\Api\V1;

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
        Route::get('prospect-lists/{prospect_list}/contacts', [V1\ProspectListController::class, 'contacts']);
        Route::post('prospect-lists/{prospect_list}/contacts', [V1\ProspectListController::class, 'addContacts']);
        Route::delete('prospect-lists/{prospect_list}/contacts', [V1\ProspectListController::class, 'removeContacts']);
        Route::apiResource('prospect-lists', V1\ProspectListController::class);
        Route::post('email-campaigns/{email_campaign}/send', [V1\EmailCampaignController::class, 'send'])->middleware('throttle:10,1');
        Route::post('email-campaigns/{email_campaign}/schedule', [V1\EmailCampaignController::class, 'schedule']);
        Route::post('email-campaigns/{email_campaign}/cancel', [V1\EmailCampaignController::class, 'cancel']);
        Route::get('email-campaigns/{email_campaign}/deliveries', [V1\EmailCampaignController::class, 'deliveries']);
        Route::apiResource('email-campaigns', V1\EmailCampaignController::class);
        Route::get('dashboard', V1\DashboardController::class);
        Route::get('activity-logs/filters', [V1\ActivityLogController::class, 'filters']);
        Route::get('activity-logs', [V1\ActivityLogController::class, 'index']);
        Route::apiResource('users', V1\UserController::class);
        Route::apiResource('roles', V1\RoleController::class);
        Route::get('permissions', [V1\PermissionController::class, 'index']);
        Route::apiResource('companies', V1\CompanyController::class);
        Route::apiResource('contacts', V1\ContactController::class);
    });
});

Route::post('webhooks/brevo', [BrevoWebhookController::class, 'handle']);

