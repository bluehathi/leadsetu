<?php

namespace App\Services;

use App\Models\Workspace;
use Illuminate\Support\Facades\Auth;

class WorkspaceService
{
    public function createWorkspace(array $data): Workspace
    {
        return Workspace::create($data);
    }

    public function updateWorkspace(Workspace $workspace, array $data): Workspace
    {
        $workspace->update($data);
        return $workspace;
    }

    public function deleteWorkspace(Workspace $workspace): void
    {
        $workspace->delete();
    }
}
