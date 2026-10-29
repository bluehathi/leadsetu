<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BrevoWebhookController;
use App\Http\Controllers\Api\V1;

// Versioned API consumed by the SPA (Sanctum cookie auth).
Route::prefix('v1')->group(function () {
    // Public account endpoints (rate limited; they answer uniformly to avoid leaking which accounts exist).
    Route::post('auth/login', [V1\AuthController::class, 'login'])->middleware('throttle:20,1');
    Route::post('auth/register', [V1\AuthController::class, 'register'])->middleware('throttle:6,1');
    Route::post('auth/forgot-password', [V1\PasswordResetController::class, 'forgot'])->middleware('throttle:5,1');
    Route::post('auth/reset-password', [V1\PasswordResetController::class, 'reset'])->middleware('throttle:5,1');
    // Target of the signed link in the verification email (name required by Laravel's notification).
    Route::get('auth/verify-email/{id}/{hash}', [V1\EmailVerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])->name('verification.verify');

    // Signed-in account endpoints: available even before the email is verified.
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [V1\AuthController::class, 'logout']);
        Route::post('auth/email/verification-notification', [V1\EmailVerificationController::class, 'resend'])->middleware('throttle:3,1');
        Route::get('me', [V1\AuthController::class, 'me']);
        Route::put('me', [V1\ProfileController::class, 'update']);
        Route::put('me/password', [V1\ProfileController::class, 'password'])->middleware('throttle:5,1');
        Route::get('me/settings', [V1\PreferencesController::class, 'show']);
        Route::put('me/settings', [V1\PreferencesController::class, 'update']);
    });

    // Business endpoints: require a verified email when REQUIRE_VERIFIED_EMAIL is on.
    Route::middleware(['auth:sanctum', 'verified.api'])->group(function () {
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

