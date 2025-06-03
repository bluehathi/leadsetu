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

// Form Requests for validation
use App\Http\Requests\StoreProspectListRequest;
use App\Http\Requests\UpdateProspectListRequest;
use App\Http\Requests\ManageContactsInListRequest;

class ProspectListController extends Controller // Rename to ProspectListController if not API
{
    /**
     * Display a listing of the prospect lists for the authenticated user's workspace.
     *
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $workspaceId = Auth::user()->workspace_id;
        $lists = ProspectList::where('workspace_id', $workspaceId)
            ->withCount('contacts')
            ->orderBy('name', 'asc')
            ->paginate($request->input('per_page', 15))
            ->withQueryString(); // Preserve query string parameters for pagination

        return Inertia::render('ProspectLists/Index', [
            'lists' => $lists,
            'filters' => $request->only(['per_page']),
            'user' => auth()->user()
            // Pass any filters back for UI
        ]);
    }

    /**
     * Show the form for creating a new prospect list.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        return Inertia::render('ProspectLists/Create',['user' => auth()->user()]);
    }

    /**
     * Store a newly created prospect list in storage.
     *
     * @param  \App\Http\Requests\StoreProspectListRequest  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);
        $workspaceId = Auth::user()->workspace_id;
        $userId = Auth::id();

        $prospectList = ProspectList::create([
            'workspace_id' => $workspaceId,
            'user_id' => $userId,
            'name' => $request->name,
            'description' => $request->description,
        ]);

        ActivityLog::create([
            'user_id' => $userId,
            'workspace_id' => $workspaceId,
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
        //$this->authorize('view', $prospectList);

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
            'user' => auth()->user(),
            'prospectList' => $prospectList->loadCount('contacts'), // Load count again if needed for display
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
        // $this->authorize('update', $prospectList);

        return Inertia::render('ProspectLists/Edit', [
            'prospectList' => $prospectList,
            'user' => auth()->user()
        ]);
    }

    /**
     * Update the specified prospect list in storage.
     *
     * 
     * @param  \App\Models\ProspectList  $prospectList
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, ProspectList $prospectList)
    {

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $prospectList->update($validated);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user()->workspace_id,
            'action' => 'updated_prospect_list',
            'description' => 'Updated prospect list: ' . $prospectList->name,
            'subject_type' => ProspectList::class,
            'subject_id' => $prospectList->id,
            'properties' => json_encode(['updated_fields' => $validated]),
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
     * Remove specified contacts from the prospect list.
     *
     * @param  \App\Http\Requests\ManageContactsInListRequest  $request  // Re-using the same request for simplicity
     * @param  \App\Models\ProspectList  $prospectList
     * @return \Illuminate\Http\RedirectResponse
     */
    public function removeContacts(Request $request, ProspectList $prospectList)
    {
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
}

