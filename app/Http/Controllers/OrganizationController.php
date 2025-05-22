<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrganizationController extends Controller
{
    public function index()
    {
        $organizations = Organization::all();
        return Inertia::render('Organizations/Index', [
            'organizations' => $organizations
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:180',
            'description' => 'nullable|string',
            'contact_email' => 'nullable|email',
            'contact_phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'logo' => 'nullable|image|max:2048',
        ]);
        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        }
        $organization = Organization::create($data);
        $this->logActivity('organization_created', $organization, 'Organization created', ['data' => $data]);
        return redirect()->route('organizations.index')->with('success', 'Organization created.');
    }

    public function update(Request $request, Organization $organization)
    {
        $data = $request->validate([
            'name' => 'required|string|max:180',
            'description' => 'nullable|string',
            'contact_email' => 'nullable|email',
            'contact_phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'logo' => 'nullable|image|max:2048',
        ]);
        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        }
        $organization->update($data);
        $this->logActivity('organization_updated', $organization, 'Organization updated', ['data' => $data]);
        return redirect()->route('organizations.index')->with('success', 'Organization updated.');
    }

    public function destroy(Organization $organization)
    {
        $organization->delete();
        $this->logActivity('organization_deleted', $organization, 'Organization deleted');
        return redirect()->route('organizations.index')->with('success', 'Organization deleted.');
    }

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
}
