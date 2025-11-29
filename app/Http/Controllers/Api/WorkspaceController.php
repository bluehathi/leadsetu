<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Services\WorkspaceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class WorkspaceController extends Controller
{
    protected $workspaceService;

    public function __construct(WorkspaceService $workspaceService)
    {
        $this->workspaceService = $workspaceService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('view_workspaces');
        return Workspace::all();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Gate::authorize('create_workspaces');
        $workspace = $this->workspaceService->createWorkspace($request->all());
        return response()->json($workspace, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Workspace $workspace)
    {
        Gate::authorize('view_workspaces');
        return $workspace;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Workspace $workspace)
    {
        Gate::authorize('edit_workspaces');
        $workspace = $this->workspaceService->updateWorkspace($workspace, $request->all());
        return response()->json($workspace);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Workspace $workspace)
    {
        Gate::authorize('delete_workspaces');
        $this->workspaceService->deleteWorkspace($workspace);
        return response()->json(null, 204);
    }
}
