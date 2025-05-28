<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class CompanyController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $companies = Company::where('workspace_id', $user->workspace_id)->get();
        return Inertia::render('Companies/Index', [
            'companies' => $companies,
        ]);
    }

    public function create()
    {
        return Inertia::render('Companies/Create');
    }

    public function store(Request $request)
    {
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

    public function edit(Company $company)
    {
        //$this->authorize('update', $company);
        return Inertia::render('Companies/Edit', [
            'company' => $company,
        ]);
    }

    public function update(Request $request, Company $company)
    {
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

    public function destroy(Company $company)
    {
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
}
