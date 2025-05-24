<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // Import the Auth facade
use Inertia\Inertia;                 // Import the Inertia facade
use Illuminate\Support\Facades\Route as LaravelRoute; // Alias to avoid potential naming conflicts

class HomeController extends Controller
{
    /**
     * Handle requests to the root URL ('/').
     *
     * Checks if the user is authenticated. If yes, redirects to the dashboard.
     * If no, renders the Inertia login page ('Auth/Login').
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse|\Inertia\Response
     */
    public function index(Request $request)
    {
        // Check if the user is currently logged in
        if (Auth::check()) {
            
            return redirect()->route('dashboard');
        }

        // User is not authenticated (is a guest), render the Inertia login page.
        // We pass the same props needed by the Login component.
        return Inertia::render('Auth/Login', [
            // Check if the password reset feature is enabled/routes exist
            'canResetPassword' => LaravelRoute::has('password.request'),
            // Pass any status message from the session (e.g., after password reset request)
            'status' => session('status'),
            // Note: Inertia automatically handles passing validation 'errors' back
        ]);
    }
}
