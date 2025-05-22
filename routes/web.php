<?php

use App\Http\Controllers\Admin\LeadsController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\AuthController;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;


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


Route::resource('/leads', LeadsController::class)->middleware(['auth', 'verified'])->except(['create']);
 
