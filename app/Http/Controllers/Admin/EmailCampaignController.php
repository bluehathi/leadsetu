<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailCampaign;
use App\Models\ProspectList;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use App\Services\EmailDispatchService;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Facades\Queue;

class EmailCampaignController extends Controller
{

    public function index()
    {
        $campaigns = EmailCampaign::where('workspace_id', Auth::user()->workspace_id)
            ->with('prospectLists') // changed from 'prospectList' to 'prospectLists'
            ->orderByDesc('created_at')
            ->paginate(15);
        return Inertia::render('EmailCampaigns/Index', [
            'campaigns' => $campaigns,
            'user' => Auth::user(),
        ]);
    }

    public function create()
    {
        $prospectLists = ProspectList::where('workspace_id', Auth::user()->workspace_id)->get();
        return Inertia::render('EmailCampaigns/Create', [
            'prospectLists' => $prospectLists,
            'user' => Auth::user(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'prospect_list_ids' => 'required|array|min:1',
            'prospect_list_ids.*' => 'exists:prospect_lists,id',
            'scheduled_at' => 'nullable|date',
        ]);
        $data['workspace_id'] = Auth::user()->workspace_id;
        $data['user_id'] = Auth::id();
        $data['status'] = 'draft';
        // Save the first prospect list as the main one for reference (optional)
        $data['prospect_list_id'] = $data['prospect_list_ids'][0];
        unset( $data['prospect_list_id']);
        $campaign = EmailCampaign::create($data);
        // Attach prospect lists to the campaign (many-to-many)
        $campaign->prospectLists()->attach($data['prospect_list_ids']);
        // Attach contacts from all selected prospect lists to the campaign (unique contacts only)
        $contactIds = collect();
        foreach ($data['prospect_list_ids'] as $listId) {
            $prospectList = ProspectList::with('contacts')->find($listId);
            if ($prospectList) {
                $contactIds = $contactIds->merge($prospectList->contacts->pluck('id'));
            }
        }
        $contactIds = $contactIds->unique()->toArray();
        $campaign->contacts()->attach($contactIds);
        // Activity Log: Campaign Created
        \App\Models\ActivityLog::create([
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user()->workspace_id,
            'action' => 'created',
            'subject_type' => EmailCampaign::class,
            'subject_id' => $campaign->id,
            'properties' => [
                'name' => $campaign->name,
                'prospect_list_ids' => $data['prospect_list_ids'],
            ],
            'message' => 'Created Email Campaign: ' . $campaign->name,
        ]);
        return Redirect::route('email-campaigns.index')->with('success', 'Email campaign created.');
    }

    public function show(Request $request, EmailCampaign $emailCampaign)
    {
        $emailCampaign->load('prospectLists', 'contacts'); // changed from 'prospectList' to 'prospectLists'
        // Gather statistics
        $totalContacts = $emailCampaign->contacts->count();
        $sentCount = $emailCampaign->emailLogs()->where('status', 'sent')->count();
        $failedCount = $emailCampaign->emailLogs()->where('status', 'failed')->count();
        $openedCount = $emailCampaign->emailLogs()->whereNotNull('opened_at')->count();
        $clickedCount = $emailCampaign->emailLogs()->whereNotNull('clicked_at')->count();
        $stats = [
            'total_contacts' => $totalContacts,
            'sent' => $sentCount,
            'failed' => $failedCount,
            'opened' => $openedCount,
            'clicked' => $clickedCount,
        ];

        // Filter contacts for modal
        $contacts = [];
        $filter = $request->input('filter');
        if ($filter) {
            if ($filter === 'total') {
                $contacts = $emailCampaign->contacts->map(function($c) {
                    return [
                        'id' => $c->id,
                        'name' => $c->name,
                        'email' => $c->email,
                        'status' => $c->pivot->status ?? null,
                    ];
                })->values();
            } else {
                $query = $emailCampaign->emailLogs();
                if ($filter === 'sent') $query->where('status', 'sent');
                if ($filter === 'failed') $query->where('status', 'failed');
                if ($filter === 'opened') $query->whereNotNull('opened_at');
                if ($filter === 'clicked') $query->whereNotNull('clicked_at');
                $contacts = $query->with('contact')->get()->map(function($log) {
                    return [
                        'id' => $log->contact->id ?? $log->id,
                        'name' => $log->contact->name ?? '-',
                        'email' => $log->contact->email ?? $log->recipient_email,
                        'status' => $log->status,
                    ];
                })->values();

                var_dump($contacts);
            }
        }

        return Inertia::render('EmailCampaigns/Show', [
            'campaign' => $emailCampaign,
            'user' => Auth::user(),
            'stats' => $stats,
            'contacts' => $contacts,
        ]);
    }

    public function edit(EmailCampaign $emailCampaign)
    {
        // Authorization: Only allow users from the same workspace
        if ($emailCampaign->workspace_id !== Auth::user()->workspace_id) {
            abort(403, 'Unauthorized');
        }
        $prospectLists = ProspectList::where('workspace_id', Auth::user()->workspace_id)->get();
        // Get selected prospect list IDs for the campaign
        $selectedProspectListIds = $emailCampaign->prospectLists()->pluck('prospect_list_id')->toArray();
        return Inertia::render('EmailCampaigns/Create', [
            'campaign' => $emailCampaign,
            'prospectLists' => $prospectLists,
            'selectedProspectListIds' => $selectedProspectListIds,
            'user' => Auth::user(),
            'isEdit' => true,
        ]);
    }

    public function update(Request $request, EmailCampaign $emailCampaign)
    {
        // Authorization: Only allow users from the same workspace
        if ($emailCampaign->workspace_id !== Auth::user()->workspace_id) {
            abort(403, 'Unauthorized');
        }
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'prospect_list_ids' => 'required|array|min:1',
            'prospect_list_ids.*' => 'exists:prospect_lists,id',
            'scheduled_at' => 'nullable|date',
        ]);
        $data['prospect_list_id'] = $data['prospect_list_ids'][0]; // for legacy/optional
        $emailCampaign->update($data);
        // Sync prospect lists
        $emailCampaign->prospectLists()->sync($data['prospect_list_ids']);
        // Sync contacts from all selected prospect lists (unique only)
        $contactIds = collect();
        foreach ($data['prospect_list_ids'] as $listId) {
            $prospectList = ProspectList::with('contacts')->find($listId);
            if ($prospectList) {
                $contactIds = $contactIds->merge($prospectList->contacts->pluck('id'));
            }
        }
        $contactIds = $contactIds->unique()->toArray();
        $emailCampaign->contacts()->sync($contactIds);
        // Activity Log: Campaign Updated
        \App\Models\ActivityLog::create([
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user()->workspace_id,
            'action' => 'updated',
            'subject_type' => EmailCampaign::class,
            'subject_id' => $emailCampaign->id,
            'properties' => [
                'name' => $emailCampaign->name,
                'prospect_list_ids' => $data['prospect_list_ids'],
            ],
            'message' => 'Updated Email Campaign: ' . $emailCampaign->name,
        ]);
        return Redirect::route('email-campaigns.show', $emailCampaign->id)->with('success', 'Email campaign updated.');
    }

    public function destroy(EmailCampaign $emailCampaign)
    {
        // Authorization: Only allow users from the same workspace
        if ($emailCampaign->workspace_id !== Auth::user()->workspace_id) {
            abort(403, 'Unauthorized');
        }
        $emailCampaign->delete();
        return Redirect::route('email-campaigns.index')->with('success', 'Email campaign deleted.');
    }

    public function sendNow(EmailCampaign $emailCampaign)
    {
        
        if ($emailCampaign->workspace_id !== Auth::user()->workspace_id) {
            abort(403, 'Unauthorized');
        }
        if ($emailCampaign->status !== 'draft' && $emailCampaign->status !== 'scheduled') {
            return Redirect::back()->with('error', 'Campaign cannot be sent.');
        }

      

       $service =  new EmailDispatchService();

  

        $emailCampaign->status = 'sending';
        $emailCampaign->save();
       
        $service->dispatchCampaign($emailCampaign);
        $emailCampaign->status = 'sent';
        
        $emailCampaign->save();
        return Redirect::route('email-campaigns.show', $emailCampaign->id)->with('success', 'Campaign sent.');
    }

    public function schedule(Request $request, EmailCampaign $emailCampaign)
    {
        if ($emailCampaign->workspace_id !== Auth::user()->workspace_id) {
            abort(403, 'Unauthorized');
        }
        $data = $request->validate([
            'scheduled_at' => 'required|date|after:now',
        ]);
        $emailCampaign->scheduled_at = $data['scheduled_at'];
        $emailCampaign->status = 'scheduled';
        $emailCampaign->save();
        // Schedule job (pseudo-code)
        EmailDispatchService::scheduleCampaign($emailCampaign);
        return Redirect::route('email-campaigns.show', $emailCampaign->id)->with('success', 'Campaign scheduled.');
    }
}
