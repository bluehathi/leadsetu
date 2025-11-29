<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Lead; // Import the Lead model
use Illuminate\Support\Facades\Route as LaravelRoute; // Alias to avoid naming conflicts
use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\Contact;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Http\Requests\Lead\StoreLeadRequest;
use App\Http\Requests\Lead\UpdateLeadRequest;
use App\Services\LeadService;
use App\Services\ActivityLogService;

class LeadsController extends Controller
{
    use AuthorizesRequests;

    protected $leadService;
    protected $activityLogService;

    public function __construct(LeadService $leadService, ActivityLogService $activityLogService)
    {
        $this->leadService = $leadService;
        $this->activityLogService = $activityLogService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Lead::class);

        $leads = Lead::query()
            ->latest() // Order by latest first (optional)
            ->where('user_id', Auth::id()) // Filter by logged-in user
            ->paginate(15) // Use pagination (adjust count as needed)
            ->withQueryString();



        return Inertia::render('Leads/Index', [
            'user' => Auth::user(),
            'leads' => $leads
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreLeadRequest $request)
    {
        $this->authorize('create', Lead::class);
        $user = Auth::user();
        $data = $request->validated();
        $data['workspace_id'] = $user->workspace_id;
        $lead = $this->leadService->createLead($data);
        $this->activityLogService->log('lead_created', $lead, 'Lead created', $data);
        return redirect()->route('leads.index')->with('success', 'Lead created.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Lead $lead)
    {
        $this->authorize('view', $lead);

        return Inertia::render('Leads/Show', [
            'user' => Auth::user(),
            'lead' => $lead,
        ]);
    }

    /**
     * Show the form for creating a new lead.
     */
    public function create()
    {
        $this->authorize('create', Lead::class);

        $user = Auth::user();
        $companies = Company::where('workspace_id', $user->workspace_id)->get();
        $users = \App\Models\User::where('workspace_id', $user->workspace_id)->get();
        return Inertia::render('Leads/Create', [
            'user' => $user,
            'companies' => $companies,
            'contacts' => [],
            'users' => $users,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Lead $lead)
    {
        $this->authorize('update', $lead);

        $lead = Lead::with(['company', 'contact'])->findOrFail($lead->id);
        $companies = Company::where('workspace_id', Auth::user()->workspace_id)->get();
        $contacts = Contact::where('workspace_id', Auth::user()->workspace_id)->get();
        return Inertia::render('Leads/Edit', [
            'user' => Auth::user(),
            'lead' => $lead,
            'companies' => $companies,
            'contacts' => $contacts,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateLeadRequest $request, Lead $lead)
    {
        $this->authorize('update', $lead);
        $data = $request->validated();
        $this->leadService->updateLead($lead, $data);
        $this->activityLogService->log('lead_updated', $lead, 'Lead updated', $data);
        return redirect()->route('leads.index')->with('success', 'Lead updated.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Lead $lead)
    {
        $this->authorize('delete', $lead);
        $leadId = $lead->id;
        $leadData = $lead->toArray();
        $this->leadService->deleteLead($lead);
        $this->activityLogService->log('lead_deleted', (object)['id' => $leadId], 'Lead deleted', $leadData);
        return redirect()->route('leads.index')->with('success', 'Lead deleted.');
    }

    /**
     * Show the Kanban view for leads.
     */
    public function kanban()
    {
        $this->authorize('viewAny', Lead::class);

        $user = Auth::user();
        $leads = Lead::with('company')
            ->where('workspace_id', $user->workspace_id)
            ->get();
        return Inertia::render('Leads/Kanban', [
            'user' => $user,
            'leads' => $leads,
        ]);
    }
}
