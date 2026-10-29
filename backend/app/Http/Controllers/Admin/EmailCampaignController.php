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
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Validation\Rule;
use App\Http\Requests\EmailCampaign\StoreEmailCampaignRequest;
use App\Http\Requests\EmailCampaign\UpdateEmailCampaignRequest;
use App\Services\EmailCampaignService;
use App\Services\ActivityLogService;


class EmailCampaignController extends Controller
{
    use AuthorizesRequests;

    protected $emailCampaignService;
    protected $activityLogService;

    public function __construct(EmailCampaignService $emailCampaignService, ActivityLogService $activityLogService)
    {
        $this->emailCampaignService = $emailCampaignService;
        $this->activityLogService = $activityLogService;
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', EmailCampaign::class);

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
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', EmailCampaign::class);

        $prospectLists = ProspectList::where('workspace_id', Auth::user()->workspace_id)->get();
        return Inertia::render('EmailCampaigns/Create', [
            'prospectLists' => $prospectLists,
        ]);
    }

    public function store(StoreEmailCampaignRequest $request)
    {
        $this->authorize('create', EmailCampaign::class);
        $user = Auth::user();
        $data = $request->validated();
        $data['workspace_id'] = $user->workspace_id;
        $emailCampaign = $this->emailCampaignService->createEmailCampaign($data);
        $this->activityLogService->log('email_campaign_created', $emailCampaign, 'Email Campaign created', $data);
        return redirect()->route('email-campaigns.index')->with('success', 'Email Campaign created.');
    }

    public function show(Request $request, EmailCampaign $emailCampaign)
    {
        $this->authorize('view', $emailCampaign);

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
            'stats' => $stats,
            'contacts' => $contactsForModal,
            'filters' => ['filter' => $filter]
        ]);
    }

    public function edit(EmailCampaign $emailCampaign)
    {
        $this->authorize('update', $emailCampaign);

        if ($emailCampaign->workspace_id !== Auth::user()->workspace_id) {
            abort(403);
        }
        $prospectLists = ProspectList::where('workspace_id', Auth::user()->workspace_id)->get();
        $selectedProspectListIds = $emailCampaign->prospectLists()->pluck('prospect_list_id')->toArray();
        return Inertia::render('EmailCampaigns/Create', [
            'campaign' => $emailCampaign,
            'prospectLists' => $prospectLists,
            'selectedProspectListIds' => $selectedProspectListIds,
            'isEdit' => true,
        ]);
    }

    public function update(UpdateEmailCampaignRequest $request, EmailCampaign $emailCampaign)
    {
        $this->authorize('update', $emailCampaign);
        $data = $request->validated();
        $this->emailCampaignService->updateEmailCampaign($emailCampaign, $data);
        $this->activityLogService->log('email_campaign_updated', $emailCampaign, 'Email Campaign updated', $data);
        return redirect()->route('email-campaigns.index')->with('success', 'Email Campaign updated.');
    }

    public function destroy(EmailCampaign $emailCampaign)
    {
        $this->authorize('delete', $emailCampaign);
        $emailCampaignId = $emailCampaign->id;
        $emailCampaignData = $emailCampaign->toArray();
        $this->emailCampaignService->deleteEmailCampaign($emailCampaign);
        $this->activityLogService->log('email_campaign_deleted', (object)['id' => $emailCampaignId], 'Email Campaign deleted', $emailCampaignData);
        return redirect()->route('email-campaigns.index')->with('success', 'Email Campaign deleted.');
    }

    public function bulkDestroy(Request $request)
    {
        $this->authorize('deleteAny', EmailCampaign::class);

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
        $this->authorize('send', $emailCampaign);

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
        $this->authorize('update', $emailCampaign);

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
