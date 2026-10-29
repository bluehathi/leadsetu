<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspace\UpdateCurrentWorkspaceRequest;
use App\Http\Resources\WorkspaceResource;
use App\Services\ActivityLogService;
use App\Services\WorkspaceService;
use Illuminate\Http\Request;

/**
 * A user belongs to exactly one workspace, so the API exposes "the current workspace"
 * (no list/create/delete: those would let a tenant touch other tenants).
 */
class WorkspaceController extends Controller
{
    public function __construct(protected WorkspaceService $workspaces, protected ActivityLogService $audit)
    {
    }

    public function show(Request $request): WorkspaceResource
    {
        $workspace = $request->user()->workspace;
        abort_if(! $workspace, 404);
        $this->authorize('view', $workspace);

        return new WorkspaceResource($workspace);
    }

    public function update(UpdateCurrentWorkspaceRequest $request): WorkspaceResource
    {
        $workspace = $this->workspaces->updateWorkspace($request->user()->workspace, $request->validated());
        $this->audit->log('workspace_updated', $workspace, 'Workspace updated', $request->validated());

        return new WorkspaceResource($workspace);
    }
}
