<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProspectList;
use App\Models\Contact;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia; // Import Inertia
use Illuminate\Foundation\Auth\Access\AuthorizesRequests; // Import AuthorizesRequests trait

// Form Requests for validation
use App\Http\Requests\ProspectList\StoreProspectListRequest;
use App\Http\Requests\ProspectList\UpdateProspectListRequest;
use App\Http\Requests\ManageContactsInListRequest;

class ProspectListController extends Controller // Rename to ProspectListController if not API
{
    use AuthorizesRequests; // Use the AuthorizesRequests trait

    /**
     * Display a listing of the prospect lists for the authenticated user's workspace.
     *
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', ProspectList::class);

        $workspaceId = Auth::user()->workspace_id;
        // When fetching for the modal, pagination might not be desired,
        // but for the main ProspectLists/Index page it is.
        // The modal call doesn't pass 'per_page', so it will use the default.
        // Consider if a separate, non-paginated endpoint for the modal is better long-term.
        $lists = ProspectList::where('workspace_id', $workspaceId)
            ->withCount('contacts')
            ->orderBy('name', 'asc')
            ->paginate($request->input('per_page', 15))
            ->withQueryString(); // Preserve query string parameters for pagination

        return Inertia::render('ProspectLists/Index', [ // This is for the main prospect list index page
            'lists' => $lists,
            'filters' => $request->only(['per_page']),
        ]);
    }

    /**
     * Show the form for creating a new prospect list.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        $this->authorize('create', ProspectList::class);

        return Inertia::render('ProspectLists/Create');
    }

    /**
     * Store a newly created prospect list in storage.
     *
     * @param  \App\Http\Requests\StoreProspectListRequest  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(StoreProspectListRequest $request)
    {
        $this->authorize('create', ProspectList::class);
        $user = Auth::user();
        $data = $request->validated();
        $data['workspace_id'] = $user->workspace_id;
        $prospectList = ProspectList::create($data);

        ActivityLog::create([
            'user_id' => $user->id,
            'workspace_id' => $user->workspace_id,
            'action' => 'created_prospect_list',
            'description' => 'Created prospect list: ' . $prospectList->name,
            'subject_type' => ProspectList::class,
            'subject_id' => $prospectList->id,
            'properties' => json_encode(['name' => $prospectList->name, 'description' => $prospectList->description]),
        ]);

        return Redirect::route('prospect-lists.index')->with('success', 'Prospect list created successfully.');
    }

    /**
     * Display the specified prospect list, including its contacts.
     *
     * @param  \App\Models\ProspectList  $prospectList
     * @return \Inertia\Response
     */
    public function show(Request $request, ProspectList $prospectList)
    {
        $this->authorize('view', $prospectList);

        // Eager load contacts with pagination
        $contacts = $prospectList->contacts()
            ->orderBy('name', 'asc') // Assuming Contact model has 'name'
            ->paginate($request->input('per_page_contacts', 10))
            ->withQueryString();

        // Get all contacts in the workspace for adding to the list (potential improvement: server-side search)
        $workspaceContacts = Contact::where('workspace_id', Auth::user()->workspace_id)
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'email']); // Select only necessary fields

        return Inertia::render('ProspectLists/Show', [
            'prospectList' => $prospectList->loadCount('contacts'),
            'contactsInList' => $contacts,
            'workspaceContacts' => $workspaceContacts, // For a dropdown/modal to add contacts
            'filters' => $request->only(['per_page_contacts']),
        ]);
    }

    /**
     * Show the form for editing the specified prospect list.
     *
     * @param  \App\Models\ProspectList  $prospectList
     * @return \Inertia\Response
     */
    public function edit(ProspectList $prospectList)
    {
        $this->authorize('update', $prospectList);

        return Inertia::render('ProspectLists/Edit', [
            'prospectList' => $prospectList,
        ]);
    }

    /**
     * Update the specified prospect list in storage.
     *
     * 
     * @param  \App\Models\ProspectList  $prospectList
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(UpdateProspectListRequest $request, ProspectList $prospectList)
    {
        $this->authorize('update', $prospectList);
        $data = $request->validated();
        $prospectList->update($data);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user()->workspace_id,
            'action' => 'updated_prospect_list',
            'description' => 'Updated prospect list: ' . $prospectList->name,
            'subject_type' => ProspectList::class,
            'subject_id' => $prospectList->id,
            'properties' => json_encode(['updated_fields' => $data]),
        ]);

        return Redirect::route('prospect-lists.show', $prospectList)->with('success', 'Prospect list updated successfully.');
    }

    /**
     * Remove the specified prospect list from storage.
     *
     * @param  \App\Models\ProspectList  $prospectList
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(ProspectList $prospectList)
    {
        $this->authorize('delete', $prospectList);

        $name = $prospectList->name;
        $id = $prospectList->id;
        $workspaceId = $prospectList->workspace_id;
        $prospectList->delete();

        ActivityLog::create([
            'user_id' => Auth::id(),
            'workspace_id' => $workspaceId,
            'action' => 'deleted_prospect_list',
            'description' => 'Deleted prospect list: ' . $name,
            'subject_type' => ProspectList::class,
            'subject_id' => $id,
            'properties' => json_encode(['name' => $name]),
        ]);

        return Redirect::route('prospect-lists.index')->with('success', 'Prospect list deleted successfully.');
    }

    /**
     * Add specified contacts to the prospect list.
     *
     * @param  \App\Http\Requests\ManageContactsInListRequest  $request
     * @param  \App\Models\ProspectList  $prospectList
     * @return \Illuminate\Http\RedirectResponse
     */
    public function addContacts(Request $request, ProspectList $prospectList)
    {
        $this->authorize('update', $prospectList);

        $request->validate([
            'contact_ids' => 'required|array|min:1',
            'contact_ids.*' => 'integer|exists:contacts,id',
        ]);
        $workspaceId = Auth::user()->workspace_id;
        $contactIds = $request->input('contact_ids', []);
        $validContacts = Contact::where('workspace_id', $workspaceId)
            ->whereIn('id', $contactIds)
            ->pluck('id')
            ->toArray();
        if (empty($validContacts)) {
            return Redirect::back()->with('error', 'No valid contacts selected for this workspace.');
        }
        $now = now()->toDateString();
        $pivotData = [];
        foreach ($validContacts as $id) {
            $pivotData[$id] = ['subscribed_at' => $now];
        }
        $prospectList->contacts()->syncWithoutDetaching($pivotData);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'workspace_id' => $workspaceId,
            'action' => 'added_contacts_to_prospect_list',
            'description' => 'Added contacts to prospect list: ' . $prospectList->name . ' (IDs: ' . implode(',', $validContacts) . ')',
            'subject_type' => ProspectList::class,
            'subject_id' => $prospectList->id,
            'properties' => json_encode(['contact_ids' => $validContacts]),
        ]);

        return Redirect::back()->with('success', 'Contacts added to list successfully.');
    }

    /**
     * Store a new prospect list and add specified contacts to it.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function storeAndAddContacts(Request $request)
    {
        $this->authorize('create', ProspectList::class);

        $request->validate([
            'name' => 'required|string|max:255|unique:prospect_lists,name,NULL,id,workspace_id,' . Auth::user()->workspace_id,
            'contact_ids' => 'required|array|min:1',
            'contact_ids.*' => 'integer|exists:contacts,id',
        ]);

        $workspaceId = Auth::user()->workspace_id;
        $userId = Auth::id();

        $prospectList = ProspectList::create([
            'workspace_id' => $workspaceId,
            'user_id' => $userId,
            'name' => $request->name,
        ]);

        // Ensure contacts belong to the same workspace before attaching
        $validContactIds = Contact::where('workspace_id', $workspaceId)
                                   ->whereIn('id', $request->contact_ids)
                                   ->pluck('id');

        $prospectList->contacts()->syncWithoutDetaching($validContactIds);

        return redirect()->back()->with('success', 'Contacts added to new list: ' . $prospectList->name);
    }
    /**
     * Remove specified contacts from the prospect list.
     *
     * @param  \App\Http\Requests\ManageContactsInListRequest  $request  // Re-using the same request for simplicity
     * @param  \App\Models\ProspectList  $prospectList
     * @return \Illuminate\Http\RedirectResponse
     */
    public function removeContacts(Request $request, ProspectList $prospectList)
    {
        $this->authorize('update', $prospectList);

        $contactIds = $request->input('contact_ids');
        $prospectList->contacts()->detach($contactIds);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user()->workspace_id,
            'action' => 'removed_contacts_from_prospect_list',
            'description' => 'Removed contacts from prospect list: ' . $prospectList->name . ' (IDs: ' . (is_array($contactIds) ? implode(',', $contactIds) : $contactIds) . ')',
            'subject_type' => ProspectList::class,
            'subject_id' => $prospectList->id,
            'properties' => json_encode(['contact_ids' => $contactIds]),
        ]);

        return Redirect::back()->with('success', 'Contacts removed from list successfully.');
    }

    /**
     * Return all prospect lists for the current workspace as JSON (for modal use).
     */
    public function listForModal(Request $request)
    {
        $this->authorize('viewAny', ProspectList::class);

        $workspaceId = Auth::user()->workspace_id;
        $lists = ProspectList::where('workspace_id', $workspaceId)
            ->orderBy('name', 'asc')
            ->get(['id', 'name']);
        return response()->json(['lists' => $lists]);
    }

    /**
     * Add specified contacts to multiple prospect lists.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function addContactsToMultipleLists(Request $request)
    {
        $this->authorize('updateAny', ProspectList::class);

        $request->validate([
            'contact_ids' => 'required|array|min:1',
            'contact_ids.*' => 'integer|exists:contacts,id',
            'prospect_list_ids' => 'required|array|min:1',
            'prospect_list_ids.*' => 'integer|exists:prospect_lists,id',
        ]);
        $workspaceId = Auth::user()->workspace_id;
        $contactIds = $request->input('contact_ids', []);
        $listIds = $request->input('prospect_list_ids', []);
        $now = now()->toDateString();
        $validContacts = Contact::where('workspace_id', $workspaceId)
            ->whereIn('id', $contactIds)
            ->pluck('id')
            ->toArray();
        if (empty($validContacts)) {
            return Redirect::back()->with('error', 'No valid contacts selected for this workspace.');
        }
        foreach ($listIds as $listId) {
            $prospectList = ProspectList::where('workspace_id', $workspaceId)->find($listId);
            if ($prospectList) {
                $pivotData = [];
                foreach ($validContacts as $id) {
                    $pivotData[$id] = ['subscribed_at' => $now];
                }
                $prospectList->contacts()->syncWithoutDetaching($pivotData);
                ActivityLog::create([
                    'user_id' => Auth::id(),
                    'workspace_id' => $workspaceId,
                    'action' => 'added_contacts_to_prospect_list',
                    'description' => 'Added contacts to prospect list: ' . $prospectList->name . ' (IDs: ' . implode(',', $validContacts) . ')',
                    'subject_type' => ProspectList::class,
                    'subject_id' => $prospectList->id,
                    'properties' => json_encode(['contact_ids' => $validContacts]),
                ]);
            }
        }
        return Redirect::back()->with('success', 'Contacts added to selected lists successfully.');
    }

    /**
     * Get all prospect list IDs for a contact (for modal pre-check).
     */
    public function contactLists(Request $request, $contactId)
    {
        $this->authorize('viewAny', ProspectList::class);

        $workspaceId = Auth::user()->workspace_id;
        $contact = Contact::where('workspace_id', $workspaceId)->findOrFail($contactId);
        $listIds = $contact->prospectLists()->pluck('prospect_lists.id');
        return response()->json(['list_ids' => $listIds]);
    }
}
