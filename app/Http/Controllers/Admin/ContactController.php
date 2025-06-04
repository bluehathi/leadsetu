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

class ContactController extends Controller
{
    public function index(Request $request)
    {
        $query = Contact::query()
            ->where('workspace_id', Auth::user()->workspace_id) // Scope by workspace
            ->with('company'); // Eager load company if you display it

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
        
        $contacts = $query->paginate($request->input('per_page', 15)) // Default to 15 per page
                           ->withQueryString(); // Appends current query string to pagination links

        return Inertia::render('Contacts/Index', [
            'user' => Auth::user(),
            'contacts' => $contacts,
            // 'workspaces' => ... // Pass workspaces if needed by your view
            'filters' => $request->only(['search', 'sort_by', 'sort_direction', 'per_page']), // Pass active filters back
        ]);
    }

    public function create()
    {
        $companies = Company::all();

        return Inertia::render('Contacts/Create', [
            'companies' => $companies,
             'user' => Auth::user(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'company_id' => 'required|exists:companies,id',
            'title' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        // Require at least one of phone or email
        if (empty($request->input('email')) && empty($request->input('phone'))) {
            return redirect()->back()
                ->withErrors(['email' => 'Either email or phone is required.', 'phone' => 'Either phone or email is required.'])
                ->withInput();
        }

       $data = $request->all();
       $data['workspace_id'] = auth()->user()->workspace_id;

        $contact = Contact::create($data);

        // Log activity for contact creation
        if (class_exists('App\\Models\\ActivityLog')) {
            \App\Models\ActivityLog::create([
                'user_id' => auth()->id(),
                'workspace_id' => auth()->user()->workspace_id,
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
        $companies = Company::all();

        return Inertia::render('Contacts/Edit', [
            'contact' => $contact,
            'companies' => $companies,
             'user' => Auth::user(),
        ]);
    }

    public function update(Request $request, Contact $contact)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'company_id' => 'nullable|exists:companies,id',
            'title' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        // Require at least one of phone or email
        if (empty($request->input('email')) && empty($request->input('phone'))) {
            return redirect()->back()
                ->withErrors(['email' => 'Either email or phone is required.', 'phone' => 'Either phone or email is required.'])
                ->withInput();
        }

        $contact->update($request->all());

        // Log activity for contact update
        if (class_exists('App\\Models\\ActivityLog')) {
            \App\Models\ActivityLog::create([
                'user_id' => auth()->id(),
                'workspace_id' => auth()->user()->workspace_id,
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
        $contactId = $contact->id;
        $contactData = $contact->toArray();
        $contact->delete();

        // Log activity for contact deletion
        if (class_exists('App\\Models\\ActivityLog')) {
            \App\Models\ActivityLog::create([
                'user_id' => auth()->id(),
                'workspace_id' => auth()->user()->workspace_id,
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
            ->where('workspace_id', auth()->user()->workspace_id)
            ->get();
        return response()->json(['contacts' => $contacts]);
    }

    public function import_excel()
    {
        return Inertia::render('Contacts/ImportExcel', [
            'user' => Auth::user(),
        ]);
    }

    public function import_excel_store(Request $request)
    {
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