<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    use AuthorizesRequests;

    public function index()
    {
        $this->authorize('view', 'settings');

        return Inertia::render('Settings/Index');
    }

    public function update(Request $request)
    {
        $this->authorize('update', 'settings');

        // Update logic here...
    }
}
