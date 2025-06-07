<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreSettingRequest;
use App\Http\Requests\Settings\UpdateSettingRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Settings;

class SettingController extends Controller
{
    use AuthorizesRequests;

    public function index()
    {
        //$this->authorize('view', 'settings');

        return Inertia::render('Settings/Index');
    }

    public function store(StoreSettingRequest $request)
    {
        $this->authorize('create', Settings::class);
        $data = $request->validated();
        $setting = Settings::create($data);
        // ...existing code...
    }

    public function update(UpdateSettingRequest $request, Settings $setting)
    {
        $this->authorize('update', $setting);
        $data = $request->validated();
        $setting->update($data);
        // ...existing code...
    }
}
