<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Lead; // Import the Lead model
use Illuminate\Support\Facades\Route as LaravelRoute; // Alias to avoid naming conflicts
use App\Models\ActivityLog;

class LeadsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        $leads = Lead::query()
        ->latest() // Order by latest first (optional)
        ->where('user_id', \Illuminate\Support\Facades\Auth::id()) // Example: Filter by logged-in user (if applicable)
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
            'email' => 'string|email',
            'phone' => 'string|max:20',
            'company' => 'required|string|max:180',
            'website' => 'string|max:180',
            'notes' => 'required|string|max:180',
            'status' => 'required|string|max:180',
            'source' => 'required|string|max:180',
            'title' => 'nullable|string|max:180',
            'positions' => 'nullable|string|max:180',
            'tags' => 'nullable|array',
            'deal_value' => 'nullable|numeric',
            'expected_close' => 'nullable|date',
            'lead_score' => 'nullable|numeric',
            'lead_owner' => 'nullable|string|max:180',
            'priority' => 'nullable|string|max:20',
            'attachments' => 'nullable|array',
        ]);

        // Create a new lead    
        $lead = Lead::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'company' => $request->company,
            'website' => $request->website,
            'notes' => $request->notes,
            'status' => $request->status,
            'source' => $request->source,
            'title' => $request->title,
            'positions' => $request->positions,
            'tags' => $request->tags,
            'deal_value' => $request->deal_value,
            'expected_close' => $request->expected_close,
            'lead_score' => $request->lead_score,
            'lead_owner' => $request->lead_owner,
            'priority' => $request->priority,
            'attachments' => $request->attachments,
            'user_id' => Auth::id(), // Associate the lead with the authenticated user
            'organization_id' => Auth::user()->organization_id ?? null,
        ]); 

        $lead->calculateScoreAndQualification();

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
        $activityLogs = $lead->activityLogs()->with('user')->get();
        return Inertia::render('Leads/Show', [
            'user' => Auth::user(), 
            'lead' => $lead,
            'activityLogs' => $activityLogs,
            'deal_value' => $lead->deal_value,
            'expected_close' => $lead->expected_close,
            'lead_score' => $lead->lead_score,
            'lead_owner' => $lead->lead_owner,
            'priority' => $lead->priority,
            'attachments' => $lead->attachments,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $lead = Lead::findOrFail($id);
        return Inertia::render('Leads/Edit', [
            'user' => Auth::user(),
            'lead' => $lead,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Lead $lead)
    {
        $data = $request->validate([
            'name' => 'required|string|max:180',
            'email' => 'string|email',
            'phone' => 'string|max:20',
            'company' => 'required|string|max:180',
            'website' => 'string|max:180',
            'notes' => 'required|string|max:180',
            'status' => 'required|string|max:180',
            'source' => 'required|string|max:180',
            'title' => 'nullable|string|max:180',
            'positions' => 'nullable|string|max:180',
            'tags' => 'nullable|array',
            'deal_value' => 'nullable|numeric',
            'expected_close' => 'nullable|date',
            'lead_score' => 'nullable|numeric',
            'lead_owner' => 'nullable|string|max:180',
            'priority' => 'nullable|string|max:20',
            'attachments' => 'nullable|array',
        ]);

        $lead->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'company' => $request->company,
            'website' => $request->website,
            'notes' => $request->notes,
            'status' => $request->status,
            'source' => $request->source,
            'title' => $request->title,
            'positions' => $request->positions,
            'tags' => $request->tags,
            'deal_value' => $request->deal_value,
            'expected_close' => $request->expected_close,
            'lead_score' => $request->lead_score,
            'lead_owner' => $request->lead_owner,
            'priority' => $request->priority,
            'attachments' => $request->attachments,
            'organization_id' => Auth::user()->organization_id ?? null,
        ]);

        $lead->calculateScoreAndQualification();

        $this->logActivity('lead_updated', $lead, 'Lead updated', ['data' => $data]);

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
            'action' => $action,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject->id ?? null,
            'description' => $description,
            'properties' => $properties,
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
}
