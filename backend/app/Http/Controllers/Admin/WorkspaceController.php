<?php

namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;

use App\Models\ActivityLog;
use App\Models\Workspace;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Requests\Workspace\StoreWorkspaceRequest;
use App\Http\Requests\Workspace\UpdateWorkspaceRequest;
use App\Services\WorkspaceService;
use App\Services\ActivityLogService;

class WorkspaceController extends Controller
{
    use AuthorizesRequests;

    protected $workspaceService;
    protected $activityLogService;

    public function __construct(WorkspaceService $workspaceService, ActivityLogService $activityLogService)
    {
        $this->workspaceService = $workspaceService;
        $this->activityLogService = $activityLogService;
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Workspace::class);

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

    public function create()
    {
        $this->authorize('create', Workspace::class);

        return Inertia::render('Workspaces/Create');
    }

    public function store(StoreWorkspaceRequest $request)
    {
        $this->authorize('create', Workspace::class);
        $data = $request->validated();
        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        }
        $workspace = $this->workspaceService->createWorkspace($data);
        $this->activityLogService->log('workspace_created', $workspace, 'Workspace created', $data);
        return redirect()->route('workspaces.index')->with('success', 'Workspace created.');
    }

    public function show(Workspace $workspace)
    {
        $this->authorize('view', $workspace);

        return Inertia::render('Workspaces/Show', [
            'workspace' => $workspace,
        ]);
    }

    public function edit(Workspace $workspace)
    {
        $this->authorize('update', $workspace);

        return Inertia::render('Workspaces/Edit', [
            'workspace' => $workspace,
        ]);
    }

    public function update(UpdateWorkspaceRequest $request, Workspace $workspace)
    {
        $this->authorize('update', $workspace);
        $data = $request->validated();
        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        }
        $this->workspaceService->updateWorkspace($workspace, $data);
        $this->activityLogService->log('workspace_updated', $workspace, 'Workspace updated', $data);
        return redirect()->route('workspaces.index')->with('success', 'Workspace updated.');
    }

    public function destroy(Workspace $workspace)
    {
        $this->authorize('delete', $workspace);
        // Prevent workspace deletion
        return redirect()->route('workspaces.index')->with('error', 'Workspace deletion is not allowed.');
    }
}
