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
            'company_id' => 'nullable|exists:companies,id',
            'contact_id' => 'nullable|exists:contacts,id',
            'notes' => 'required|string|max:180',
            'status' => 'required|string|max:180',
            'source' => 'required|string|max:180',
            'deal_value' => 'nullable|integer',
            'expected_close' => 'nullable|date',
            'lead_score' => 'nullable|integer',
            'lead_owner' => 'nullable|string|max:180',
            'priority' => 'required|string|max:20',
            'title' => 'nullable|string|max:180',
            'positions' => 'nullable|string|max:180',
            'tags' => 'nullable|string',
        ]);

        // Handle company: Only use selected company_id, do not create new company
        $companyId = $request->company_id;
        if ($companyId) {
            $company = Company::where('id', $companyId)
                ->where('workspace_id', Auth::user()->workspace_id)
                ->first();
            if ($company) {
                $data['company_name'] = $company->name;
                $data['company_website'] = $company->website;
            }
        } else {
            $company = null;
            $data['company_name'] = null;
            $data['company_website'] = null;
        }

        // Handle contact: Only use selected contact_id, do not create new contact
        $contactId = $request->contact_id;
        if ($contactId) {
            $contact = Contact::where('id', $contactId)
                ->where('workspace_id', Auth::user()->workspace_id)
                ->first();
            if ($contact) {
                $data['contact_name'] = $contact->name;
                $data['contact_email'] = $contact->email;
                $data['contact_phone'] = $contact->phone;
            }
        } else {
            $contact = null;
            $data['contact_name'] = null;
            $data['contact_email'] = null;
            $data['contact_phone'] = null;
        }

        // Parse tags if string (comma separated)
        $tags = $request->tags;
        if (is_string($tags)) {
            $tags = collect(explode(',', $tags))->map(fn($t) => trim($t))->filter()->values()->all();
        }

        $lead = Lead::create([
            'name' => $request->name,
            'email' => $data['contact_email'],
            'phone' => $data['contact_phone'],
            'company_id' => $companyId,
            'contact_id' => $contactId,
            'website' => $data['company_website'],
            'company' => $data['company_name'],
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
            'notes' => 'required|string|max:180',
            'status' => 'required|string|max:180',
            'source' => 'required|string|max:180',
            'deal_value' => 'nullable|integer',
            'expected_close' => 'nullable|date',
            'lead_score' => 'nullable|integer',
            'priority' => 'nullable|string|max:20',
            'title' => 'nullable|string|max:180',
            'positions' => 'nullable|string|max:180',
            'tags' => 'nullable|string',
        ]);

        
       
        // Parse tags if string (comma separated)
        $tags = $request->tags;
        if (is_string($tags)) {
            $tags = collect(explode(',', $tags))->map(fn($t) => trim($t))->filter()->values()->all();
        }

        $lead->update([
            'name' => $request->name,
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

        if (!$request->inertia()) {
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
