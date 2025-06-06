<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class CompanyController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the companies for the current workspace.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Company::class);

        $user = Auth::user();
        $companies = Company::where('workspace_id', $user->workspace_id)->get();
        return Inertia::render('Companies/Index', [
            'companies' => $companies,
            'user' => $user
        ]);
    }

    /**
     * Show the form for creating a new company.
     */
    public function create()
    {
        $this->authorize('create', Company::class);

        return Inertia::render('Companies/Create', [
            'user' => Auth::user()
        ]);
    }

    /**
     * Store a newly created company in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $this->authorize('create', Company::class);

        $user = Auth::user();
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'website' => 'nullable|string|max:255',
        ]);
        $data['workspace_id'] = $user->workspace_id;
        $company = Company::create($data);
        // Log activity for company creation
        if (class_exists('App\\Models\\ActivityLog')) {
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'workspace_id' => $user->workspace_id,
                'action' => 'company_created',
                'subject_type' => Company::class,
                'subject_id' => $company->id,
                'description' => 'Company created',
                'properties' => json_encode($data),
            ]);
        }
        return redirect()->route('companies.index')->with('success', 'Company created.');
    }

    /**
     * Show the form for editing the specified company.
     *
     * @param  \App\Models\Company  $company
     * @return \Inertia\Response
     */
    public function edit(Company $company)
    {
        $this->authorize('update', $company);

        return Inertia::render('Companies/Edit', [
            'company' => $company,
             'user' => Auth::user()
        ]);
    }

    /**
     * Update the specified company in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Company  $company
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Company $company)
    {
        $this->authorize('update', $company);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'website' => 'nullable|string|max:255',
        ]);
        $company->update($data);
        // Log activity for company update
        if (class_exists('App\\Models\\ActivityLog')) {
            \App\Models\ActivityLog::create([
                'user_id' => Auth::id(),
                'workspace_id' => Auth::user()->workspace_id,
                'action' => 'company_updated',
                'subject_type' => Company::class,
                'subject_id' => $company->id,
                'description' => 'Company updated',
                'properties' => json_encode($data),
            ]);
        }
        return redirect()->route('companies.index')->with('success', 'Company updated.');
    }

    /**
     * Remove the specified company from storage.
     *
     * @param  \App\Models\Company  $company
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Company $company)
    {
        $this->authorize('delete', $company);

        $companyId = $company->id;
        $companyData = $company->toArray();
        $company->delete();
        // Log activity for company deletion
        if (class_exists('App\\Models\\ActivityLog')) {
            \App\Models\ActivityLog::create([
                'user_id' => Auth::id(),
                'workspace_id' => Auth::user()->workspace_id,
                'action' => 'company_deleted',
                'subject_type' => Company::class,
                'subject_id' => $companyId,
                'description' => 'Company deleted',
                'properties' => json_encode($companyData),
            ]);
        }
        return redirect()->route('companies.index')->with('success', 'Company deleted.');
    }


    /**
     * Store a new company with minimal input via AJAX (for inline creation).
     * Prevents duplicate names per workspace (case-insensitive, trimmed).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function storeCompany(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'website' => 'nullable|string|max:255',
        ]);
        $workspaceId = \Illuminate\Support\Facades\Auth::user()->workspace_id;
        $companyName = trim($request->name);
        //create a website if provided
        $website = $request->website ? trim($request->website) : null;

        // Prevent duplicate company names in the same workspace (case-insensitive, trimmed)
        // $existing = Company::where('workspace_id', $workspaceId)
        //     ->whereRaw('LOWER(TRIM(name)) = ?', [strtolower($companyName)])
        //     ->first();
        // if ($existing) {
        //     return response()->json([
        //         'message' => 'A company with this name already exists in your workspace.',
        //         'errors' => ['name' => ['A company with this name already exists in your workspace.']],
        //     ], 422);
        // }
        $company = Company::create([
            'name' => $companyName,
            'workspace_id' => $workspaceId,
            'website' => $website,
        ]);
        // Log activity for company creation
        if (class_exists('App\\Models\\ActivityLog')) {
            \App\Models\ActivityLog::create([
                'user_id' => \Illuminate\Support\Facades\Auth::id(),
                'workspace_id' => $workspaceId,
                'action' => 'company_created',
                'subject_type' => Company::class,
                'subject_id' => $company->id,
                'description' => 'Company created',
                'properties' => json_encode($company->toArray()),
            ]);
        }
        return response()->json([
            'company' => $company,
        ], 201);
    }
}
