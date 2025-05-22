<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // Facade for Authentication
use Illuminate\Support\Facades\Route as LaravelRoute; // Alias to avoid naming conflicts
use Illuminate\Validation\ValidationException; // For handling validation errors
use Inertia\Inertia; // Inertia facade for rendering views
use App\Http\Controllers\Controller; // Base controller

class AuthController extends Controller
{
    /**
     * Display the login view.
     *
     * Renders the Inertia component located at 'resources/js/Pages/Auth/Login.jsx'.
     * Passes necessary props like 'canResetPassword' and 'status'.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function showLoginForm(Request $request)
    {
        // Render the Inertia component for the login page
        return Inertia::render('Auth/Login', [
            // Check if the password reset feature is enabled/routes exist
            'canResetPassword' => LaravelRoute::has('password.request'),
            // Pass any status message from the session (e.g., after password reset request)
            'status' => session('status'),
            // Note: Inertia automatically handles passing validation 'errors' back on failed POST requests
        ]);
    }

    /**
     * Handle an incoming authentication request.
     *
     * Validates the request, attempts to authenticate the user,
     * regenerates the session, and redirects upon success or failure.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     * @throws \Illuminate\Validation\ValidationException
     */
    public function login(Request $request)
    {
        // 1. Validate the incoming request data
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        // 2. Attempt to authenticate the user
        // 'remember' parameter determines if a long-lived session cookie is created
        $remember = $request->boolean('remember'); // Get boolean value from 'remember' checkbox

        if (!Auth::attempt($request->only('email', 'password'), $remember)) {
            // Authentication failed: Throw a validation exception
            // This will automatically redirect back with the error message
            // attached to the 'email' field (or a general error).
            throw ValidationException::withMessages([
                'email' => __('auth.failed'), // Use translation string for "These credentials do not match our records."
            ]);
        }

        // 3. Authentication successful: Regenerate the session ID
        // This helps prevent session fixation attacks.
        $request->session()->regenerate();

        // 4. Redirect the user to their intended destination or the dashboard
        // `redirect()->intended()` attempts to redirect to the URL the user
        // was trying to access before being prompted to log in.
        // If there was no intended URL, it falls back to the route named 'dashboard'.
        return redirect()->intended(route('dashboard'));
    }

    /**
     * Log the user out of the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function logout(Request $request)
    {
        // Log the current user out
        Auth::logout();

        // Invalidate the user's session.
        $request->session()->invalidate();

        // Regenerate the CSRF token value.
        $request->session()->regenerateToken();

        // Redirect the user to the home page (or login page)
        return redirect('/'); // Redirect to the root URL
    }
}
