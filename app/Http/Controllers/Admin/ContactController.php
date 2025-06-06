<?php

namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;

use App\Models\Contact;
use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\ContactCompanyImport;
use App\Models\MailConfiguration;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Http\Requests\Contact\StoreContactRequest;
use App\Http\Requests\Contact\UpdateContactRequest;

class ContactController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Contact::class);

        $query = Contact::query()
            ->where('workspace_id', Auth::user()->workspace_id)
            ->with(['company', 'prospectLists:id,name']); // Eager load company and prospect lists (id, name)

        // Search
        if ($request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%")
                  ->orWhere('phone', 'like', "%{$searchTerm}%")
                  ->orWhere('title', 'like', "%{$searchTerm}%")
                  ->orWhereHas('company', function ($cq) use ($searchTerm) {
                      $cq->where('name', 'like', "%{$searchTerm}%");
                  });
            });
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        // Validate sortBy to prevent arbitrary column sorting and handle related table sorting
        $allowedSorts = ['name', 'email', 'created_at', 'company_name']; // Add more as needed
        
        if (in_array($sortBy, $allowedSorts)) {
            if ($sortBy === 'company_name') {
                // Ensure you have a 'companies' table and 'company_id' on 'contacts'
                // This assumes 'company' relationship is defined in Contact model
                // For direct sorting on related table column, a join is often more efficient
                $query->leftJoin('companies', 'contacts.company_id', '=', 'companies.id')
                      ->orderBy('companies.name', $sortDirection)
                      ->select('contacts.*'); // Important to avoid ambiguous column errors
            } else {
                $query->orderBy($sortBy, $sortDirection);
            }
        } else {
            // Default sort if sortBy is not allowed or invalid
            $query->orderBy('created_at', 'desc');
        }
        
        $contacts = $query->paginate($request->input('per_page', 15))
                           ->withQueryString(); // Appends current query string to pagination links

        return Inertia::render('Contacts/Index', [
            'user' => Auth::user(),
            'contacts' => $contacts,
            // 'workspaces' => ... // Pass workspaces if needed by your view
            'filters' => $request->only(['search', 'sort_by', 'sort_direction', 'per_page']),
        ]);
    }

    public function create()
    {
        $this->authorize('create', Contact::class);

        $companies = Company::all();

        return Inertia::render('Contacts/Create', [
            'companies' => $companies,
             'user' => Auth::user(),
        ]);
    }

    public function store(StoreContactRequest $request)
    {
        $this->authorize('create', Contact::class);
        $user = Auth::user();
        $data = $request->validated();
        $data['workspace_id'] = $user->workspace_id;
        $contact = Contact::create($data);

        // Log activity for contact creation
        if (class_exists('App\\Models\\ActivityLog')) {
            \App\Models\ActivityLog::create([
                'user_id' => Auth::id(),
                'workspace_id' => Auth::user()->workspace_id,
                'action' => 'contact_created',
                'subject_type' => Contact::class,
                'subject_id' => $contact->id,
                'description' => 'Contact created',
                'properties' => json_encode($data),
            ]);
        }

        return redirect()->route('contacts.index')
            ->with('success', 'Contact created successfully.');
    }

    public function show(Contact $contact)
    {
        $this->authorize('view', $contact);

        $user = Auth::user();
        // Fetch email logs for this contact, most recent first
        $emailLogs = \App\Models\EmailLog::where('contact_id', $contact->id)
            ->orderByDesc('sent_at')
            ->limit(20)
            ->get();
        return Inertia::render('Contacts/Show', [
            'contact' => $contact,
            'user' => $user,
            'smtpConfig' => MailConfiguration::where('workspace_id', $user->workspace_id)->first(),
            'emailLogs' => $emailLogs,
        ]);
    }

    public function edit(Contact $contact)
    {
        $this->authorize('update', $contact);

        $companies = Company::all();

        return Inertia::render('Contacts/Edit', [
            'contact' => $contact,
            'companies' => $companies,
             'user' => Auth::user(),
        ]);
    }

    public function update(UpdateContactRequest $request, Contact $contact)
    {
        $this->authorize('update', $contact);
        $data = $request->validated();
        $contact->update($data);

        // Log activity for contact update
        if (class_exists('App\\Models\\ActivityLog')) {
            \App\Models\ActivityLog::create([
                'user_id' => Auth::id(),
                'workspace_id' => Auth::user()->workspace_id,
                'action' => 'contact_updated',
                'subject_type' => Contact::class,
                'subject_id' => $contact->id,
                'description' => 'Contact updated',
                'properties' => json_encode($request->all()),
            ]);
        }

        return redirect()->route('contacts.index')
            ->with('success', 'Contact updated successfully.');
    }

    public function destroy(Contact $contact)
    {
        $this->authorize('delete', $contact);

        $contactId = $contact->id;
        $contactData = $contact->toArray();
        $contact->delete();

        // Log activity for contact deletion
        if (class_exists('App\\Models\\ActivityLog')) {
            \App\Models\ActivityLog::create([
                'user_id' => Auth::id(),
                'workspace_id' => Auth::user()->workspace_id,
                'action' => 'contact_deleted',
                'subject_type' => Contact::class,
                'subject_id' => $contactId,
                'description' => 'Contact deleted',
                'properties' => json_encode($contactData),
            ]);
        }

        return redirect()->route('contacts.index')
            ->with('success', 'Contact deleted successfully.');
    }

    // Get contacts for a company (AJAX)
    public function contacts($companyId)
    {
        $contacts = \App\Models\Contact::where('company_id', $companyId)
            ->where('workspace_id', Auth::user()->workspace_id)
            ->get();
        return response()->json(['contacts' => $contacts]);
    }

    public function import_excel()
    {
        $this->authorize('create', Contact::class);

        return Inertia::render('Contacts/ImportExcel', [
            'user' => Auth::user(),
        ]);
    }

    public function import_excel_store(Request $request)
    {
        $this->authorize('create', Contact::class);

        $request->validate([
            'file' => 'required|file|mimes:xls,xlsx',
        ]);
        try {
            Excel::import(new ContactCompanyImport, $request->file('file'));
            return redirect()->route('contacts.index')->with('success', 'Contacts and companies imported successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['file' => 'Import failed: ' . $e->getMessage()]);
        }
    }
}