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


Route::get('/', [HomeController::class, 'index'])->name('home');


Route::get('/login', [AuthController::class, 'showLoginForm'])
     ->middleware('guest')
     ->name('login');

Route::post('/login', [AuthController::class, 'login'])
     ->middleware('guest');

Route::post('/logout', [AuthController::class, 'logout'])
     ->middleware('auth')
     ->name('logout');


Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard/Index', [
            'user' => Auth::user(), 
        ]);
    })->name('dashboard');

    Route::resource('/leads', LeadsController::class);
    Route::resource('/workspaces', WorkspaceController::class)->except(['show', 'edit', 'update', 'destroy']);
    Route::resource('/roles', RoleController::class)->except(['show', 'create']);
    Route::resource('/permissions', PermissionController::class)->except(['show', 'edit', 'create']);
    Route::resource('/users', UserController::class);
    Route::resource('contacts', ContactController::class);

    // User profile view
    Route::get('/profile', [UserController::class, 'profile'])->name('profile');
    // Update user profile
    Route::post('/profile', [UserController::class, 'updateProfile'])->name('profile.update');
    // Change password
    Route::post('/profile/password', [UserController::class, 'changePassword'])->name('profile.password');
    // Workspace settings view
    Route::get('/workspace/settings', [UserController::class, 'workspaceSettings'])->name('workspace.settings');
    // Update workspace settings
    Route::post('/workspace/settings', [UserController::class, 'updateWorkspaceSettings'])->name('workspace.settings.update');
    // Activity Logs
    Route::get('/activity-logs', [UserController::class, 'activityLogs'])->name('activity.logs');

    // User settings API
    Route::get('/user/settings', [UserController::class, 'getSettings'])->name('user.settings.get');
    Route::post('/user/settings', [UserController::class, 'setSettings'])->name('user.settings.set');

    Route::get('/roles/create', [RoleController::class, 'create'])->name('roles.create');
});

