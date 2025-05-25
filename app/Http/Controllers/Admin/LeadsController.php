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

class LeadsController extends Controller
{
    public function __construct()
    {
    //     $this->middleware('permission:view leads')->only(['index', 'show']);
    //     $this->middleware('permission:create leads')->only(['store']);
    //     $this->middleware('permission:edit leads')->only(['update']);
    //     $this->middleware('permission:delete leads')->only(['destroy']);
     }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {

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
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:180',
            'email' => 'nullable|string|email',
            'phone' => 'nullable|string|max:20',
            'company_id' => 'nullable|exists:companies,id',
            'company_name' => 'nullable|string|max:180',
            'company_website' => 'nullable|string|max:255',
            'contact_id' => 'nullable|exists:contacts,id',
            'contact_name' => 'nullable|string|max:180',
            'contact_email' => 'nullable|string|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'website' => 'nullable|string|max:180',
            'notes' => 'nullable|string|max:180',
            'status' => 'required|string|max:180',
            'source' => 'required|string|max:180',
            'deal_value' => 'nullable|integer',
            'expected_close' => 'nullable|date',
            'lead_score' => 'nullable|integer',
            'lead_owner' => 'nullable|string|max:180',
            'priority' => 'nullable|string|max:20',
            'title' => 'nullable|string|max:180',
            'positions' => 'nullable|string|max:180',
            'tags' => 'nullable|string',
        ]);

        // Handle company
        $companyId = $request->company_id;
        if (!$companyId && $request->company_name) {
            $company = Company::create([
                'name' => $request->company_name,
                'website' => $request->company_website,
                'workspace_id' => Auth::user()->workspace_id,
            ]);
            $companyId = $company->id;
        }

        // Handle contact
        $contactId = $request->contact_id;
        if (!$contactId && $request->contact_name) {
            $contact = Contact::create([
                'name' => $request->contact_name,
                'email' => $request->contact_email,
                'phone' => $request->contact_phone,
                'company_id' => $companyId,
                'workspace_id' => Auth::user()->workspace_id,
            ]);
            $contactId = $contact->id;
        }

        // Parse tags if string (comma separated)
        $tags = $request->tags;
        if (is_string($tags)) {
            $tags = collect(explode(',', $tags))->map(fn($t) => trim($t))->filter()->values()->all();
        }

        $lead = Lead::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'company_id' => $companyId,
            'contact_id' => $contactId,
            'website' => $request->website,
            'notes' => $request->notes,
            'status' => $request->status,
            'source' => $request->source,
            'deal_value' => $request->deal_value,
            'expected_close' => $request->expected_close,
            'lead_score' => $request->lead_score,
            'lead_owner' => $request->lead_owner,
            'priority' => $request->priority,
            'title' => $request->title,
            'positions' => $request->positions,
            'tags' => $tags,
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user()->workspace_id,
        ]);

        $this->logActivity('lead_created', $lead, 'Lead created', ['data' => $data]);

        // Redirect back to the leads index page with a success message
        return to_route('leads.index')->with('success', 'Lead created successfully.');
    
    
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $lead = Lead::findOrFail($id); // Find the lead by ID or fail

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
        return Inertia::render('Leads/Create', [
            'user' => Auth::user(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $lead = Lead::with(['company', 'contact'])->findOrFail($id);
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
    public function update(Request $request, Lead $lead)
    {
        $data = $request->validate([
            'name' => 'required|string|max:180',
            'email' => 'nullable|string|email',
            'phone' => 'nullable|string|max:20',
            'company_id' => 'nullable|exists:companies,id',
            'company_name' => 'nullable|string|max:180',
            'company_website' => 'nullable|string|max:255',
            'contact_id' => 'nullable|exists:contacts,id',
            'contact_name' => 'nullable|string|max:180',
            'contact_email' => 'nullable|string|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'website' => 'nullable|string|max:180',
            'notes' => 'nullable|string|max:180',
            'status' => 'required|string|max:180',
            'source' => 'required|string|max:180',
            'deal_value' => 'nullable|integer',
            'expected_close' => 'nullable|date',
            'lead_score' => 'nullable|integer',
            'lead_owner' => 'nullable|string|max:180',
            'priority' => 'nullable|string|max:20',
            'title' => 'nullable|string|max:180',
            'positions' => 'nullable|string|max:180',
            'tags' => 'nullable|string',
        ]);

        // Handle company
        $companyId = $request->company_id;
        if (!$companyId && $request->company_name) {
            $company = Company::create([
                'name' => $request->company_name,
                'website' => $request->company_website,
                'workspace_id' => Auth::user()->workspace_id,
            ]);
            $companyId = $company->id;
        }

        // Handle contact
        $contactId = $request->contact_id;
        if (!$contactId && $request->contact_name) {
            $contact = Contact::create([
                'name' => $request->contact_name,
                'email' => $request->contact_email,
                'phone' => $request->contact_phone,
                'company_id' => $companyId,
                'workspace_id' => Auth::user()->workspace_id,
            ]);
            $contactId = $contact->id;
        }

        // Parse tags if string (comma separated)
        $tags = $request->tags;
        if (is_string($tags)) {
            $tags = collect(explode(',', $tags))->map(fn($t) => trim($t))->filter()->values()->all();
        }

        $lead->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'company_id' => $companyId,
            'contact_id' => $contactId,
            'website' => $request->website,
            'notes' => $request->notes,
            'status' => $request->status,
            'source' => $request->source,
            'deal_value' => $request->deal_value,
            'expected_close' => $request->expected_close,
            'lead_score' => $request->lead_score,
            'lead_owner' => $request->lead_owner,
            'priority' => $request->priority,
            'title' => $request->title,
            'positions' => $request->positions,
            'tags' => $tags,
        ]);

        $this->logActivity('lead_updated', $lead, 'Lead updated', ['data' => $data]);

        if ($request->inertia()) {
            // Return a minimal JSON response to satisfy Inertia
            return response()->json(['success' => true, 'id' => $lead->id, 'status' => $lead->status]);
        }
        return to_route('leads.index')->with('success', 'Lead updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Lead $lead)
    {
        $lead->delete();
        $this->logActivity('lead_deleted', $lead, 'Lead deleted');
        // Redirect back to the leads index page with a success message
        return to_route('leads.index')->with('success', 'Lead deleted successfully.');
    }

    /**
     * Log an activity.
     *
     * @param  string  $action
     * @param  mixed  $subject
     * @param  string|null  $description
     * @param  array  $properties
     * @return void
     */
    protected function logActivity($action, $subject = null, $description = null, $properties = [])
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user() ? Auth::user()->workspace_id : null,
            'action' => $action,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject->id ?? null,
            'description' => $description,
            'properties' => $properties,
        ]);
    }

    /**
     * Show the Kanban view for leads.
     */
    public function kanban()
    {
        
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
