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
    Route::get('/leads/kanban', [\App\Http\Controllers\Admin\LeadsController::class, 'kanban'])->name('leads.kanban');
    Route::get('contacts/import-excel', [\App\Http\Controllers\Admin\ContactController::class, 'import_excel'])->name('contacts.import_excel');
    Route::post('contacts/import-excel', [\App\Http\Controllers\Admin\ContactController::class, 'import_excel_store'])->name('contacts.import_excel.store');
    Route::resource('/leads', App\Http\Controllers\Admin\LeadsController::class);
    Route::resource('/workspaces', App\Http\Controllers\Admin\WorkspaceController::class)->except(['show', 'edit', 'update', 'destroy']);
    Route::resource('/roles', App\Http\Controllers\Admin\RoleController::class)->except(['show', 'create']);
    Route::resource('/permissions', App\Http\Controllers\Admin\PermissionController::class)->except(['show', 'edit', 'create']);
    Route::resource('/users', \App\Http\Controllers\Admin\UserController::class);
    Route::resource('/contacts', \App\Http\Controllers\Admin\ContactController::class);
    Route::resource('/companies', \App\Http\Controllers\Admin\CompanyController::class);
    Route::get('/profile', [\App\Http\Controllers\Admin\UserController::class, 'profile'])->name('profile');
    Route::post('/profile', [\App\Http\Controllers\Admin\UserController::class, 'updateProfile'])->name('profile.update');
    Route::post('/profile/password', [\App\Http\Controllers\Admin\UserController::class, 'changePassword'])->name('profile.password');
    Route::get('/workspace/settings', [\App\Http\Controllers\Admin\UserController::class, 'workspaceSettings'])->name('workspace.settings');
    Route::post('/workspace/settings', [\App\Http\Controllers\Admin\UserController::class, 'updateWorkspaceSettings'])->name('workspace.settings.update');
    Route::get('/activity-logs', [\App\Http\Controllers\Admin\UserController::class, 'activityLogs'])->name('activity.logs');
    Route::get('/user/settings', [\App\Http\Controllers\Admin\UserController::class, 'getSettings'])->name('user.settings.get');
    Route::post('/user/settings', [\App\Http\Controllers\Admin\UserController::class, 'setSettings'])->name('user.settings.set');
    Route::get('/roles/create', [\App\Http\Controllers\Admin\RoleController::class, 'create'])->name('roles.create');
    // Minimal company creation for AJAX (from contact form)
    Route::post('/store-company', [\App\Http\Controllers\Admin\CompanyController::class, 'storeCompany'])->name('contact.company.store');
    // Route for fetching contacts by company (AJAX)
    Route::get('companies/{company}/contacts', [\App\Http\Controllers\Admin\ContactController::class, 'contacts'])->name('company.contacts');
    
    
});

// Home route
Route::get('/', [HomeController::class, 'index'])->name('home');

