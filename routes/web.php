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
use App\Http\Controllers\Admin\ProspectListController;

// Auth routes
Route::get('/login', [AuthController::class, 'showLoginForm'])->middleware('guest')->name('login');
Route::post('/login', [AuthController::class, 'login'])->middleware('guest');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');
Route::get('/register', [AuthController::class, 'showRegistrationForm'])->middleware('guest')->name('register');
Route::post('/register', [AuthController::class, 'register'])->middleware('guest');

// Admin-protected routes
Route::middleware(['auth', 'verified'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/leads/kanban', [LeadsController::class, 'kanban'])->name('leads.kanban')->middleware('permission:view_leads');
    Route::resource('/leads', App\Http\Controllers\Admin\LeadsController::class)->middleware('permission:view_leads');;
    Route::resource('/workspaces', App\Http\Controllers\Admin\WorkspaceController::class)->except(['show', 'edit', 'update', 'destroy'])->middleware('permission:view_workspaces');;
    Route::resource('/roles', App\Http\Controllers\Admin\RoleController::class)->except(['show', 'create'])->middleware('permission:view_roles');
    Route::resource('/permissions', App\Http\Controllers\Admin\PermissionController::class)->except(['show', 'edit', 'create'])->middleware('permission:view_permissions');;
    Route::resource('/users', UserController::class)->middleware('permission:view_users');

    Route::resource('/companies', CompanyController::class);
    Route::get('/profile', [UserController::class, 'profile'])->name('profile');
    Route::post('/profile', [UserController::class, 'updateProfile'])->name('profile.update');
    Route::post('/profile/password', [UserController::class, 'changePassword'])->name('profile.password');
    Route::get('/workspace/settings', [UserController::class, 'workspaceSettings'])->name('workspace.settings')->middleware('permission:workspace_owner');
    Route::post('/workspace/settings', [UserController::class, 'updateWorkspaceSettings'])->name('workspace.settings.update')->middleware('permission:workspace_owner');
    Route::get('/activity-logs', [UserController::class, 'activityLogs'])->name('activity.logs')->middleware('permission:view_activity_logs');
    Route::get('/user/settings', [UserController::class, 'getSettings'])->name('user.settings.get');
    Route::post('/user/settings', [UserController::class, 'setSettings'])->name('user.settings.set');

    // Minimal company creation for AJAX (from contact form)
    Route::post('/store-company', [CompanyController::class, 'storeCompany'])->name('contact.company.store')->middleware('permission:create_companies');
    // Route for fetching contacts by company (AJAX)
    Route::get('companies/{company}/contacts', [ContactController::class, 'contacts'])->name('company.contacts');

    //setting index page
    Route::get('settings', [SettingController::class, 'index'])->name('settings.index')->middleware('permission:manage_settings');;

    //smtp 
    Route::get('settings/smtp', [SMTPController::class, 'index'])->name('smtp.index')->middleware('permission:manage_smtp_settings');
    Route::post('settings/smtp', [SMTPController::class, 'save'])->name('settings.smtp.save')->middleware('permission:manage_smtp_settings');
    Route::post('settings/smtp/test', [SMTPController::class, 'test'])->name('settings.smtp.test')->middleware('permission:manage_smtp_settings');
    Route::resource('/companies', CompanyController::class)->middleware('permission:view_companies');
    //for contacts
    Route::post('/contacts/{contact}/send-email', [ContactEmailController::class, 'sendComposedEmail'])->name('contacts.sendComposedEmail')->middleware('permission:create_leads'); // Assuming sending email is part of lead/contact management
    Route::get('contacts/import-excel', [ContactController::class, 'import_excel'])->name('contacts.import_excel')->middleware('permission:create_leads'); // Assuming import is part of contact creation
    Route::post('contacts/import-excel', [ContactController::class, 'import_excel_store'])->name('contacts.import_excel.store')->middleware('permission:create_leads'); // Assuming import is part of contact creation
    Route::resource('/contacts', ContactController::class)->middleware('permission:view_leads');; // Assuming contacts are related to leads

    //Prospect List
    Route::post('prospect-lists/{prospect_list}/add-contacts', [ProspectListController::class, 'addContacts'])
        ->name('prospect-lists.add-contacts')->middleware('permission:create_leads'); // Assuming managing prospect lists is related to lead/contact management
    Route::post('prospect-lists/store-and-add-contacts', [ProspectListController::class, 'storeAndAddContacts'])
        ->name('prospect-lists.store-and-add-contacts')->middleware('permission:create_prospect_lists'); // Adjust permission as needed
    Route::post('prospect-lists/{prospect_list}/remove-contacts', [ProspectListController::class, 'removeContacts'])->name('prospect-lists.remove-contacts')->middleware('permission:edit_prospect_lists'); // Assuming managing prospect lists is related to lead/contact management
    Route::get('/prospect-lists/modal-list', [ProspectListController::class, 'listForModal'])->name('prospect-lists.modal-list');

    Route::post('prospect-lists/add-contacts-multi', [ProspectListController::class, 'addContactsToMultipleLists'])
        ->name('prospect-lists.add-contacts-multi')->middleware('permission:create_leads'); // New route for adding contacts to multiple lists

    Route::resource('prospect-lists', ProspectListController::class)->middleware('permission:view_prospect_lists'); // Assuming prospect lists are related to leads
    Route::get('prospect-lists/contact/{contact}/lists', [ProspectListController::class, 'contactLists'])
        ->name('prospect-lists.contact-lists');

    // Email Campaign routes
    Route::post('email-campaigns/bulk-destroy', [App\Http\Controllers\Admin\EmailCampaignController::class, 'bulkDestroy'])->name('email-campaigns.bulk-destroy');
    Route::resource('email-campaigns', App\Http\Controllers\Admin\EmailCampaignController::class)->middleware('permission:view_campaigns');
    Route::post('email-campaigns/{email_campaign}/send', [App\Http\Controllers\Admin\EmailCampaignController::class, 'sendNow'])->name('email-campaigns.send')->middleware('permission:send_campaign');
    Route::post('email-campaigns/{email_campaign}/schedule', [App\Http\Controllers\Admin\EmailCampaignController::class, 'schedule'])->name('email-campaigns.schedule')->middleware('permission:create_campaign');
});

// Home route
Route::get('/', [HomeController::class, 'index'])->name('home');
