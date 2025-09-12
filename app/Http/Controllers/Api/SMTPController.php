<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MailConfiguration;
use App\Services\SMTPService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SMTPController extends Controller
{
    protected $smtpService;

    public function __construct(SMTPService $smtpService)
    {
        $this->smtpService = $smtpService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('manage_smtp_settings');
        return MailConfiguration::all();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Gate::authorize('manage_smtp_settings');
        $smtp = $this->smtpService->createSMTP($request->all());
        return response()->json($smtp, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(MailConfiguration $smtp)
    {
        Gate::authorize('manage_smtp_settings');
        return $smtp;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, MailConfiguration $smtp)
    {
        Gate::authorize('manage_smtp_settings');
        $smtp = $this->smtpService->updateSMTP($smtp, $request->all());
        return response()->json($smtp);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MailConfiguration $smtp)
    {
        Gate::authorize('manage_smtp_settings');
        $this->smtpService->deleteSMTP($smtp);
        return response()->json(null, 204);
    }
}
