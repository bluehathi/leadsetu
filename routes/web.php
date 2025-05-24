<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\Admin\LeadsController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\WorkspaceController;


Route::get('/', [HomeController::class, 'index'])->name('home');


Route::get('/login', [AuthController::class, 'showLoginForm'])
     ->middleware('guest')
     ->name('login');

Route::post('/login', [AuthController::class, 'login'])
     ->middleware('guest');

Route::post('/logout', [AuthController::class, 'logout'])
     ->middleware('auth')
     ->name('logout');


Route::get('/dashboard', function () {
    return Inertia::render('Dashboard/Index', [
        'user' => Auth::user(), 
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');


Route::resource('/leads', LeadsController::class)->middleware(['auth', 'verified']);
//Route::get('/leads/create', [LeadsController::class, 'create'])->middleware(['auth', 'verified'])->name('leads.create');
Route::resource('/workspaces', WorkspaceController::class)->middleware(['auth', 'verified'])->except(['show', 'edit', 'update', 'destroy']);
Route::resource('/roles', RoleController::class)->middleware(['auth', 'verified'])->except(['show', 'create']);
Route::resource('/permissions', PermissionController::class)->middleware(['auth', 'verified'])->except(['show', 'edit', 'create']);
Route::resource('/users', UserController::class)->middleware(['auth', 'verified']);

// User profile view
Route::get('/profile', [UserController::class, 'profile'])->name('profile')->middleware(['auth', 'verified']);
// Update user profile
Route::post('/profile', [UserController::class, 'updateProfile'])->name('profile.update')->middleware(['auth', 'verified']);
// Change password
Route::post('/profile/password', [UserController::class, 'changePassword'])->name('profile.password')->middleware(['auth', 'verified']);
// Workspace settings view
Route::get('/workspace/settings', [UserController::class, 'workspaceSettings'])->name('workspace.settings')->middleware(['auth', 'verified']);
// Update workspace settings
Route::post('/workspace/settings', [UserController::class, 'updateWorkspaceSettings'])->name('workspace.settings.update')->middleware(['auth', 'verified']);
// Activity Logs
Route::get('/activity-logs', [UserController::class, 'activityLogs'])->name('activity.logs')->middleware(['auth', 'verified']);

// User settings API
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/user/settings', [UserController::class, 'getSettings'])->name('user.settings.get');
    Route::post('/user/settings', [UserController::class, 'setSettings'])->name('user.settings.set');
});

Route::get('/roles/create', [RoleController::class, 'create'])->name('roles.create')->middleware(['auth', 'verified']);

Route::resource('contacts', ContactController::class);
