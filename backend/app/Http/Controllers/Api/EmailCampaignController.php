<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailCampaign;
use App\Services\EmailCampaignService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class EmailCampaignController extends Controller
{
    protected $emailCampaignService;

    public function __construct(EmailCampaignService $emailCampaignService)
    {
        $this->emailCampaignService = $emailCampaignService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('view_campaigns');
        return EmailCampaign::all();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Gate::authorize('create_campaign');
        $emailCampaign = $this->emailCampaignService->createEmailCampaign($request->all());
        return response()->json($emailCampaign, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(EmailCampaign $emailCampaign)
    {
        Gate::authorize('view_campaigns');
        return $emailCampaign;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, EmailCampaign $emailCampaign)
    {
        Gate::authorize('edit_campaign');
        $emailCampaign = $this->emailCampaignService->updateEmailCampaign($emailCampaign, $request->all());
        return response()->json($emailCampaign);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(EmailCampaign $emailCampaign)
    {
        Gate::authorize('delete_campaign');
        $this->emailCampaignService->deleteEmailCampaign($emailCampaign);
        return response()->json(null, 204);
    }
}
