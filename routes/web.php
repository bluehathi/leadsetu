<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\Admin\LeadsController;
use App\Http\Controllers\Admin\HomeController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\ContactController;
use App\Http\Controllers\Admin\WorkspaceController;
use App\Http\Controllers\Admin\CompanyController;


// Auth routes
Route::get('/login', [AuthController::class, 'showLoginForm'])->middleware('guest')->name('login');
Route::post('/login', [AuthController::class, 'login'])->middleware('guest');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');
Route::get('/register', [AuthController::class, 'showRegistrationForm'])->middleware('guest')->name('register');
Route::post('/register', [AuthController::class, 'register'])->middleware('guest');

// Admin-protected routes
Route::middleware(['auth', 'verified'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');
    Route::resource('/leads', App\Http\Controllers\Admin\LeadsController::class);
    Route::resource('/workspaces', App\Http\Controllers\Admin\WorkspaceController::class)->except(['show', 'edit', 'update', 'destroy']);
    Route::resource('/roles', App\Http\Controllers\Admin\RoleController::class)->except(['show', 'create']);
    Route::resource('/permissions', App\Http\Controllers\Admin\PermissionController::class)->except(['show', 'edit', 'create']);
    Route::resource('/users', App\Http\Controllers\Admin\UserController::class);
    Route::resource('/contacts', App\Http\Controllers\Admin\ContactController::class);
    Route::resource('/companies', App\Http\Controllers\Admin\CompanyController::class);

    // User profile view
    Route::get('/profile', [App\Http\Controllers\Admin\UserController::class, 'profile'])->name('profile');
    // Update user profile
    Route::post('/profile', [App\Http\Controllers\Admin\UserController::class, 'updateProfile'])->name('profile.update');
    // Change password
    Route::post('/profile/password', [App\Http\Controllers\Admin\UserController::class, 'changePassword'])->name('profile.password');
    // Workspace settings view
    Route::get('/workspace/settings', [App\Http\Controllers\Admin\UserController::class, 'workspaceSettings'])->name('workspace.settings');
    // Update workspace settings
    Route::post('/workspace/settings', [App\Http\Controllers\Admin\UserController::class, 'updateWorkspaceSettings'])->name('workspace.settings.update');
    // Activity Logs
    Route::get('/activity-logs', [App\Http\Controllers\Admin\UserController::class, 'activityLogs'])->name('activity.logs');
    // User settings API
    Route::get('/user/settings', [App\Http\Controllers\Admin\UserController::class, 'getSettings'])->name('user.settings.get');
    Route::post('/user/settings', [App\Http\Controllers\Admin\UserController::class, 'setSettings'])->name('user.settings.set');
    Route::get('/roles/create', [App\Http\Controllers\Admin\RoleController::class, 'create'])->name('roles.create');
    Route::get('/leads/kanban', [\App\Http\Controllers\Admin\LeadsController::class, 'kanban'])->name('leads.kanban');
});

// Home route
Route::get('/', [HomeController::class, 'index'])->name('home');

