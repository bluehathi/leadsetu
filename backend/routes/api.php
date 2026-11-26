<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BrevoWebhookController;
use App\Http\Controllers\Api\McpController;
use App\Http\Controllers\Api\McpOAuthController;
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
    // OAuth callback from Google (YouTube) / Meta (Instagram) — secured via encrypted state payload.
    Route::get('social/oauth/{platform}/callback', [V1\SocialAccountController::class, 'oauthCallback']);
    Route::get('social/drive/temp-media/{workspaceId}/{fileId}', [V1\GoogleDriveController::class, 'tempMedia'])
        ->middleware('signed')
        ->name('social.drive.temp-media');

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
        Route::get('mcp/tokens', [V1\McpTokenController::class, 'index']);
        Route::post('mcp/tokens', [V1\McpTokenController::class, 'store']);
        Route::patch('mcp/tokens/{mcp_token}', [V1\McpTokenController::class, 'update']);
        Route::delete('mcp/tokens/{mcp_token}', [V1\McpTokenController::class, 'destroy']);
        Route::post('mcp/oauth/approve', [McpOAuthController::class, 'approve']);
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
        Route::get('business', [V1\BusinessProfileController::class, 'show']);
        Route::put('business', [V1\BusinessProfileController::class, 'update']);
        Route::apiResource('tax-rates', V1\TaxRateController::class);
        Route::apiResource('items', V1\ItemController::class);
        Route::post('quotes/{quote}/status', [V1\QuoteController::class, 'status']);
        Route::post('quotes/{quote}/convert', [V1\QuoteController::class, 'convert']);
        Route::apiResource('quotes', V1\QuoteController::class);
        Route::post('invoices/{invoice}/issue', [V1\InvoiceController::class, 'issue']);
        Route::post('invoices/{invoice}/void', [V1\InvoiceController::class, 'void']);
        Route::post('invoices/{invoice}/payments', [V1\InvoiceController::class, 'recordPayment']);
        Route::post('payments/{payment}/void', [V1\InvoiceController::class, 'voidPayment']);
        Route::apiResource('invoices', V1\InvoiceController::class);
        Route::apiResource('users', V1\UserController::class);
        Route::apiResource('roles', V1\RoleController::class);
        Route::get('permissions', [V1\PermissionController::class, 'index']);
        Route::apiResource('companies', V1\CompanyController::class);
        Route::post('contacts/import', [V1\ContactController::class, 'import'])->middleware('throttle:5,1');
        Route::post('contacts/{contact}/send-email', [V1\ContactController::class, 'sendEmail'])->middleware('throttle:30,1');
        Route::apiResource('contacts', V1\ContactController::class);

        // Social Growth Studio (multi-account YouTube & Instagram management + vidIQ-style tools)
        Route::get('social/overview', [V1\SocialAccountController::class, 'overview']);
        Route::get('social/brands/{social_brand}/analytics', [V1\SocialBrandController::class, 'analytics']);
        Route::apiResource('social/brands', V1\SocialBrandController::class)->parameters(['brands' => 'social_brand']);
        Route::get('social/oauth/{platform}/url', [V1\SocialAccountController::class, 'oauthUrl']);
        Route::post('social/accounts/sync-all', [V1\SocialAccountController::class, 'syncAll']);
        Route::post('social/accounts/{social_account}/sync', [V1\SocialAccountController::class, 'sync']);
        Route::get('social/accounts/{social_account}/analytics', [V1\SocialAccountController::class, 'analytics']);
        Route::get('social/accounts/{social_account}/videos/{videoId}/analytics', [V1\SocialAccountController::class, 'videoAnalytics']);
        Route::apiResource('social/accounts', V1\SocialAccountController::class)->parameters(['accounts' => 'social_account']);
        Route::post('social/contents/optimize', [V1\SocialContentController::class, 'optimize']);
        Route::post('social/contents/{social_content}/publish-from-drive', [V1\GoogleDriveController::class, 'publishToYouTube']);
        Route::post('social/contents/{social_content}/sync-youtube', [V1\GoogleDriveController::class, 'updateLiveYouTube']);
        Route::post('social/contents/{social_content}/share', [V1\SocialContentController::class, 'share']);
        Route::post('social/contents/{social_content}/first-comment', [V1\SocialContentController::class, 'updateFirstComment']);
        Route::apiResource('social/contents', V1\SocialContentController::class)->parameters(['contents' => 'social_content']);
        Route::get('social/drive/status', [V1\GoogleDriveController::class, 'status']);
        Route::get('social/drive/oauth/url', [V1\GoogleDriveController::class, 'oauthUrl']);
        Route::get('social/drive/files', [V1\GoogleDriveController::class, 'files']);
        Route::post('social/drive/folders', [V1\GoogleDriveController::class, 'createFolder']);
        Route::post('social/drive/files/upload', [V1\GoogleDriveController::class, 'uploadFile']);
        Route::patch('social/drive/files/{fileId}/rename', [V1\GoogleDriveController::class, 'renameFile']);
        Route::patch('social/drive/files/{fileId}/move', [V1\GoogleDriveController::class, 'moveFile']);
        Route::delete('social/drive/files/{fileId}', [V1\GoogleDriveController::class, 'deleteFile']);
        Route::post('social/drive/favorites', [V1\GoogleDriveController::class, 'toggleFavorite']);
        Route::post('social/drive/default-folder', [V1\GoogleDriveController::class, 'setDefaultFolder']);
        Route::post('social/drive/lock-folder', [V1\GoogleDriveController::class, 'toggleLockFolder']);
        Route::delete('social/drive/disconnect', [V1\GoogleDriveController::class, 'disconnect']);
        Route::get('social/keywords', [V1\SocialGrowthController::class, 'keywords']);
        Route::post('social/keywords/analyze', [V1\SocialGrowthController::class, 'analyzeKeyword']);
        Route::delete('social/keywords/{social_keyword}', [V1\SocialGrowthController::class, 'destroyKeyword']);
        Route::get('social/competitors', [V1\SocialGrowthController::class, 'competitors']);
        Route::post('social/competitors', [V1\SocialGrowthController::class, 'storeCompetitor']);
        Route::delete('social/competitors/{social_competitor}', [V1\SocialGrowthController::class, 'destroyCompetitor']);
        Route::get('social/ideas', [V1\SocialGrowthController::class, 'ideas']);
        Route::post('social/ideas/generate', [V1\SocialGrowthController::class, 'generateIdeas']);
        Route::patch('social/ideas/{social_idea}/status', [V1\SocialGrowthController::class, 'updateIdeaStatus']);
        Route::post('social/ideas/{social_idea}/convert', [V1\SocialGrowthController::class, 'convertIdea']);
    });
});

Route::post('webhooks/brevo', [BrevoWebhookController::class, 'handle']);
Route::get('mcp', [McpController::class, 'info']);
Route::post('mcp', [McpController::class, 'handle']);
Route::post('mcp/oauth/register', [McpOAuthController::class, 'register']);
Route::post('mcp/oauth/token', [McpOAuthController::class, 'token']);

