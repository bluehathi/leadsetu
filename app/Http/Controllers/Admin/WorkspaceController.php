<?php

namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;

use App\Models\ActivityLog;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WorkspaceController extends Controller
{
    public function __construct()
    {
        // $this->middleware('permission:view workspaces')->only(['index']);
        // $this->middleware('permission:create workspaces')->only(['store']);
        // $this->middleware('permission:edit workspaces')->only(['update']);
        // $this->middleware('permission:delete workspaces')->only(['destroy']);
    }

    public function index()
    {
        $user = Auth::user();
        $workspaces = [];
        if ($user && $user->workspace_id) {
            $workspace = \App\Models\Workspace::find($user->workspace_id);
            if ($workspace) {
                $isOwner = $workspace->owners()->where('user_id', $user->id)->exists();
                $workspaceArr = $workspace->toArray();
                $workspaceArr['isOwner'] = $isOwner;
                $workspaces = [$workspaceArr];
            }
        }
        return Inertia::render('Workspaces/Index', [
            'user' => $user,
            'workspaces' => array_filter($workspaces),
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
        $workspace = Workspace::create($data);
        $this->logActivity('workspace_created', $workspace, 'Workspace created', ['data' => $data]);
        return redirect()->route('workspaces.index')->with('success', 'Workspace created.');
    }

    public function update(Request $request, Workspace $workspace)
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
        $workspace->update($data);
        $this->logActivity('workspace_updated', $workspace, 'Workspace updated', ['data' => $data]);
        return redirect()->route('workspaces.index')->with('success', 'Workspace updated.');
    }

    public function destroy(Workspace $workspace)
    {
        // Prevent workspace deletion
        return redirect()->route('workspaces.index')->with('error', 'Workspace deletion is not allowed.');
    }

    protected function logActivity($action, $subject = null, $description = null, $properties = [])
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'workspace_id' => Auth::user() ? Auth::user()->workspace_id : null,
            'action' => $action,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject->id ?? null,
            'description' => $description,
            'properties' => $properties,
        ]);
    }
}
