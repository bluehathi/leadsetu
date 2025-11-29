<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BrevoWebhookController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\WorkspaceController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\SMTPController;
use App\Http\Controllers\Api\ProspectListController;
use App\Http\Controllers\Api\EmailCampaignController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\ActivityLogController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('webhooks/brevo', [BrevoWebhookController::class, 'handle']);

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('leads', LeadController::class);
    Route::apiResource('workspaces', WorkspaceController::class);
    Route::apiResource('roles', RoleController::class);
    Route::apiResource('permissions', PermissionController::class);
    Route::apiResource('users', UserController::class);
    Route::apiResource('companies', CompanyController::class);
    Route::apiResource('contacts', ContactController::class);
    Route::apiResource('smtp-settings', SMTPController::class);
    Route::apiResource('prospect-lists', ProspectListController::class);
    Route::apiResource('email-campaigns', EmailCampaignController::class);
    Route::apiResource('settings', SettingController::class);
    Route::apiResource('activity-logs', ActivityLogController::class);
});
