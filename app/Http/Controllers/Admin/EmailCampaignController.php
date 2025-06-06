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
// Add this if you implement Form Requests and Policies
// use App\Http\Requests\StoreEmailCampaignRequest;
// use App\Http\Requests\UpdateEmailCampaignRequest;
// use App\Policies\EmailCampaignPolicy;
use Illuminate\Validation\Rule;


class EmailCampaignController extends Controller
{

    // Example of how you might use policies if implemented
    // public function __construct()
    // {
    //     $this->authorizeResource(EmailCampaign::class, 'emailCampaign');
    // }

    public function index(Request $request)
    {
        // $this->authorize('viewAny', EmailCampaign::class); // Policy example
        $query = EmailCampaign::where('workspace_id', Auth::user()->workspace_id)
            ->with('prospectLists') 
            ->orderByDesc('updated_at'); 

        if ($request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('subject', 'like', "%{$searchTerm}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $campaigns = $query->paginate(15)->withQueryString();

        return Inertia::render('EmailCampaigns/Index', [
            'campaigns' => $campaigns,
            'user' => Auth::user(),
            'filters' => $request->only(['search', 'status']), 
        ]);
    }

    public function create()
    {
        // $this->authorize('create', EmailCampaign::class); // Policy example
        $prospectLists = ProspectList::where('workspace_id', Auth::user()->workspace_id)->get();
        return Inertia::render('EmailCampaigns/Create', [
            'prospectLists' => $prospectLists,
            'user' => Auth::user(),
        ]);
    }

    // Example with StoreEmailCampaignRequest
    // public function store(StoreEmailCampaignRequest $request)
    public function store(Request $request)
    {
        // Authorization is handled by FormRequest or Policy if used
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'prospect_list_ids' => 'required|array|min:1',
            'prospect_list_ids.*' => [
                'required',
                'integer',
                Rule::exists('prospect_lists', 'id')->where(function ($query) {
                    $query->where('workspace_id', Auth::user()->workspace_id);
                }),
            ],
            'scheduled_at' => 'nullable|date|after_or_equal:now',
        ]);

        $data['workspace_id'] = Auth::user()->workspace_id;
        $data['user_id'] = Auth::id();
        $data['status'] = 'draft';
        
        if (!empty($data['prospect_list_ids'])) {
            // $data['prospect_list_id'] = $data['prospect_list_ids'][0]; // If you still need this field
        }
        
        $campaign = EmailCampaign::create($data);
        $campaign->prospectLists()->attach($data['prospect_list_ids']);
        $this->syncContactsFromProspectLists($campaign, $data['prospect_list_ids']);

        \App\Models\ActivityLog::create([
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user()->workspace_id,
            'action' => 'created',
            'subject_type' => EmailCampaign::class,
            'subject_id' => $campaign->id,
            'properties' => ['name' => $campaign->name, 'prospect_list_ids' => $data['prospect_list_ids']],
            'description' => 'Created Email Campaign: ' . $campaign->name,
        ]);
        return Redirect::route('email-campaigns.index')->with('success', 'Email campaign created.');
    }

    public function show(Request $request, EmailCampaign $emailCampaign)
    {
        // $this->authorize('view', $emailCampaign); // Policy example
        if ($emailCampaign->workspace_id !== Auth::user()->workspace_id) {
            abort(403);
        }

        $emailCampaign->load('prospectLists', 'contacts','emailLogs.contact'); 
        
        
        $totalContacts =   $emailCampaign->contacts->count();
        
        $sentCount = $emailCampaign->emailLogs()->whereNotNull('sent_at')->count();
        $deliveredCount = $emailCampaign->emailLogs()->whereNotNull('delivered_at')->count();
        $failedCount = $emailCampaign->emailLogs()->WhereNotNull('failed_at')->count();
        $openedCount = $emailCampaign->emailLogs()->whereNotNull('opened_at')->count();
        $clickedCount = $emailCampaign->emailLogs()->whereNotNull('clicked_at')->count();
        $stats = [
            'total_contacts' => $totalContacts,
            'sent' => $sentCount,
            'failed' => $failedCount,
            'opened' => $openedCount,
            'clicked' => $clickedCount,
            'delivered' => $deliveredCount
        ];

        $contactsForModal = [];
        $filter = $request->input('filter');
        if ($filter) {
            if ($filter === 'total') {
                $contactsForModal = $emailCampaign->contacts->map(function($c) {
                    return ['id' => $c->id, 'name' => $c->name, 'email' => $c->email, 'status' => $c->pivot->status ?? null];
                })->values();
            } else {
                $query = $emailCampaign->emailLogs();
                if ($filter === 'sent') $query->whereNotNull('sent_at');
                if ($filter === 'delivered') $query->whereNotNull('delivered_at');
                if ($filter === 'failed') $query->whereNotNull('failed_at');
                if ($filter === 'opened') $query->whereNotNull('opened_at');
                if ($filter === 'clicked') $query->whereNotNull('clicked_at');
                
                $contactsForModal = $query->with('contact:id,name,email')->get()->map(function($log) {
                    return [
                        'id' => $log->contact->id ?? $log->id, // Fallback if contact somehow not loaded
                        'name' => $log->contact->name ?? 'N/A',
                        'email' => $log->contact->email ?? $log->recipient_email,
                        'status' => $log->status,
                    ];
                })->values();
            }
        }

        return Inertia::render('EmailCampaigns/Show', [
            'campaign' => $emailCampaign,
            'user' => Auth::user(),
            'stats' => $stats,
            'contacts' => $contactsForModal, // Pass filtered contacts for modal
            'filters' => ['filter' => $filter] // Pass back filter for consistency
        ]);
    }

    public function edit(EmailCampaign $emailCampaign)
    {
        // $this->authorize('update', $emailCampaign); // Policy example
        if ($emailCampaign->workspace_id !== Auth::user()->workspace_id) {
            abort(403);
        }
        $prospectLists = ProspectList::where('workspace_id', Auth::user()->workspace_id)->get();
        $selectedProspectListIds = $emailCampaign->prospectLists()->pluck('prospect_list_id')->toArray();
        return Inertia::render('EmailCampaigns/Create', [
            'campaign' => $emailCampaign,
            'prospectLists' => $prospectLists,
            'selectedProspectListIds' => $selectedProspectListIds,
            'user' => Auth::user(),
            'isEdit' => true,
        ]);
    }

    // Example with UpdateEmailCampaignRequest
    // public function update(UpdateEmailCampaignRequest $request, EmailCampaign $emailCampaign)
    public function update(Request $request, EmailCampaign $emailCampaign)
    {
        // Authorization is handled by FormRequest or Policy if used
        if ($emailCampaign->workspace_id !== Auth::user()->workspace_id) {
            abort(403);
        }
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'prospect_list_ids' => 'required|array|min:1',
            'prospect_list_ids.*' => [
                'required',
                'integer',
                Rule::exists('prospect_lists', 'id')->where(function ($query) {
                    $query->where('workspace_id', Auth::user()->workspace_id);
                }),
            ],
            'scheduled_at' => 'nullable|date|after_or_equal:now',
        ]);
        
        // if (!empty($data['prospect_list_ids'])) {
        //     $data['prospect_list_id'] = $data['prospect_list_ids'][0]; 
        // }

        $emailCampaign->update($data);
        $emailCampaign->prospectLists()->sync($data['prospect_list_ids']);
        $this->syncContactsFromProspectLists($emailCampaign, $data['prospect_list_ids']);

        \App\Models\ActivityLog::create([
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user()->workspace_id,
            'action' => 'updated',
            'subject_type' => EmailCampaign::class,
            'subject_id' => $emailCampaign->id,
            'properties' => ['name' => $emailCampaign->name, 'prospect_list_ids' => $data['prospect_list_ids']],
            'description' => 'Updated Email Campaign: ' . $emailCampaign->name,
        ]);
        return Redirect::route('email-campaigns.show', $emailCampaign->id)->with('success', 'Email campaign updated.');
    }

    public function destroy(EmailCampaign $emailCampaign)
    {
        // $this->authorize('delete', $emailCampaign); // Policy example
        if ($emailCampaign->workspace_id !== Auth::user()->workspace_id) {
            abort(403);
        }
        $campaignName = $emailCampaign->name;
        $campaignId = $emailCampaign->id;
        $emailCampaign->delete();

        \App\Models\ActivityLog::create([
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user()->workspace_id,
            'action' => 'deleted',
            'subject_type' => EmailCampaign::class,
            'subject_id' => $campaignId,
            'description' => 'Deleted Email Campaign: ' . $campaignName,
        ]);
        return Redirect::route('email-campaigns.index')->with('success', 'Email campaign deleted.');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:email_campaigns,id',
        ]);

        $idsToDelete = $request->input('ids');
        
        // Ensure user can only delete campaigns from their workspace
        $campaigns = EmailCampaign::whereIn('id', $idsToDelete)
                                  ->where('workspace_id', Auth::user()->workspace_id)
                                  ->get();

        if ($campaigns->count() !== count($idsToDelete)) {
             // Optional: Log this attempt or return a more specific error
            return Redirect::route('email-campaigns.index')->with('error', 'Could not delete all selected campaigns. Some may not belong to your workspace or were already deleted.');
        }
        
        // Optional: Check policy for each campaign if granular control is needed
        // foreach ($campaigns as $campaign) {
        //     $this->authorize('delete', $campaign);
        // }

        EmailCampaign::destroy($campaigns->pluck('id')->toArray());

        \App\Models\ActivityLog::create([
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user()->workspace_id,
            'action' => 'bulk_deleted',
            'subject_type' => EmailCampaign::class,
            'subject_id' => null, // No single subject for bulk action
            'properties' => ['campaign_ids' => $campaigns->pluck('id')->toArray()],
            'description' => 'Bulk deleted Email Campaigns (IDs: ' . implode(', ', $campaigns->pluck('id')->toArray()) . ')',
        ]);
        return Redirect::route('email-campaigns.index')->with('success', 'Selected email campaigns deleted.');
    }


    public function sendNow(EmailCampaign $emailCampaign)
    {
        // $this->authorize('sendNow', $emailCampaign); // Policy example
        if ($emailCampaign->workspace_id !== Auth::user()->workspace_id) {
            abort(403);
        }
        if (!in_array($emailCampaign->status, ['draft', 'scheduled'])) {
            return Redirect::back()->with('error', 'Campaign cannot be sent in its current status.');
        }

       $service =  new EmailDispatchService();
        $emailCampaign->status = 'sending';
        $emailCampaign->save();
       
        // Consider making this asynchronous
        $service->dispatchCampaign($emailCampaign);
        
        // The status should ideally be updated by the job/service after actual sending.
        // For now, if dispatchCampaign is synchronous and successful:
        $emailCampaign->status = 'sent'; 
        $emailCampaign->save();

        return Redirect::route('email-campaigns.show', $emailCampaign->id)->with('success', 'Campaign sending process initiated.');
    }

    public function schedule(Request $request, EmailCampaign $emailCampaign)
    {
        // $this->authorize('schedule', $emailCampaign); // Policy example or use 'update'
        if ($emailCampaign->workspace_id !== Auth::user()->workspace_id) {
            abort(403);
        }
        $data = $request->validate([
            'scheduled_at' => 'required|date|after_or_equal:now',
        ]);
        $emailCampaign->scheduled_at = $data['scheduled_at'];
        $emailCampaign->status = 'scheduled';
        $emailCampaign->save();
        
        // Actual scheduling might involve dispatching a delayed job
        // ProcessEmailCampaign::dispatch($emailCampaign)->delay(Carbon::parse($data['scheduled_at']));
        // EmailDispatchService::scheduleCampaign($emailCampaign); // If this handles job creation

        return Redirect::route('email-campaigns.show', $emailCampaign->id)->with('success', 'Campaign scheduled.');
    }

    private function syncContactsFromProspectLists(EmailCampaign $campaign, array $prospectListIds): void
    {
        $contactIds = collect();
        foreach ($prospectListIds as $listId) {
            // Ensure prospect list belongs to the current workspace for security
            $prospectList = ProspectList::where('id', $listId)
                                        ->where('workspace_id', Auth::user()->workspace_id)
                                        ->with('contacts:id') // Only select 'id' from contacts
                                        ->first();
            if ($prospectList) {
                $contactIds = $contactIds->merge($prospectList->contacts->pluck('id'));
            }
        }
        $contactIds = $contactIds->unique()->all();
        $campaign->contacts()->sync($contactIds); 
    }
}
