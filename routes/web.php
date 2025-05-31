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
use App\Http\Controllers\Admin\SMTPController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\ContactEmailController;


// Auth routes
Route::get('/login', [AuthController::class, 'showLoginForm'])->middleware('guest')->name('login');
Route::post('/login', [AuthController::class, 'login'])->middleware('guest');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');
Route::get('/register', [AuthController::class, 'showRegistrationForm'])->middleware('guest')->name('register');
Route::post('/register', [AuthController::class, 'register'])->middleware('guest');

// Admin-protected routes
Route::middleware(['auth', 'verified'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/leads/kanban', [LeadsController::class, 'kanban'])->name('leads.kanban');
    Route::resource('/leads', App\Http\Controllers\Admin\LeadsController::class);
    Route::resource('/workspaces', App\Http\Controllers\Admin\WorkspaceController::class)->except(['show', 'edit', 'update', 'destroy']);
    Route::resource('/roles', App\Http\Controllers\Admin\RoleController::class)->except(['show', 'create']);
    Route::resource('/permissions', App\Http\Controllers\Admin\PermissionController::class)->except(['show', 'edit', 'create']);
    Route::resource('/users', UserController::class);
   
    Route::resource('/companies', CompanyController::class);
    Route::get('/profile', [UserController::class, 'profile'])->name('profile');
    Route::post('/profile', [UserController::class, 'updateProfile'])->name('profile.update');
    Route::post('/profile/password', [UserController::class, 'changePassword'])->name('profile.password');
    Route::get('/workspace/settings', [UserController::class, 'workspaceSettings'])->name('workspace.settings');
    Route::post('/workspace/settings', [UserController::class, 'updateWorkspaceSettings'])->name('workspace.settings.update');
    Route::get('/activity-logs', [UserController::class, 'activityLogs'])->name('activity.logs');
    Route::get('/user/settings', [UserController::class, 'getSettings'])->name('user.settings.get');
    Route::post('/user/settings', [UserController::class, 'setSettings'])->name('user.settings.set');
    Route::get('/roles/create', [RoleController::class, 'create'])->name('roles.create');
    // Minimal company creation for AJAX (from contact form)
    Route::post('/store-company', [CompanyController::class, 'storeCompany'])->name('contact.company.store');
    // Route for fetching contacts by company (AJAX)
    Route::get('companies/{company}/contacts', [ContactController::class, 'contacts'])->name('company.contacts');
    
    //setting index page
    Route::get('settings',[SettingController::class,'index'])->name('settings.index');
    
    //smtp 
    Route::get('settings/smtp',[SMTPController::class,'index'])->name('smtp.index');
    Route::post('settings/smtp', [SMTPController::class, 'save'])->name('settings.smtp.save');
    Route::post('settings/smtp/test', [SMTPController::class, 'test'])->name('settings.smtp.test');

    //for contacts
    Route::post('/contacts/{contact}/send-email', [ContactEmailController::class, 'sendComposedEmail'])->name('contacts.sendComposedEmail'); 
    Route::get('contacts/import-excel', [ContactController::class, 'import_excel'])->name('contacts.import_excel');
    Route::post('contacts/import-excel', [ContactController::class, 'import_excel_store'])->name('contacts.import_excel.store');
    Route::resource('/contacts', ContactController::class);
});

// Home route
Route::get('/', [HomeController::class, 'index'])->name('home');

