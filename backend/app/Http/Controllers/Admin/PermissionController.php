<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Inertia\Inertia;
use Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Http\Requests\Permission\StorePermissionRequest;
use App\Http\Requests\Permission\UpdatePermissionRequest;
use App\Services\PermissionService;
use App\Services\ActivityLogService;

class PermissionController extends Controller
{
    use AuthorizesRequests;

    protected $permissionService;
    protected $activityLogService;

    public function __construct(PermissionService $permissionService, ActivityLogService $activityLogService)
    {
        $this->permissionService = $permissionService;
        $this->activityLogService = $activityLogService;
    }

    public function index()
    {
        $this->authorize('viewAny', Permission::class);
        $permissions = Permission::all();
        return Inertia::render('Permissions/Index', ['permissions' => $permissions]);
    }

    public function store(StorePermissionRequest $request)
    {
        $this->authorize('create', Permission::class);
        $data = $request->validated();
        $permission = $this->permissionService->createPermission($data);
        $this->activityLogService->log('permission_created', $permission, 'Permission created', $data);
        return redirect()->route('permissions.index')->with('success', 'Permission created.');
    }

    public function update(UpdatePermissionRequest $request, Permission $permission)
    {
        $this->authorize('update', $permission);
        $data = $request->validated();
        $this->permissionService->updatePermission($permission, $data);
        $this->activityLogService->log('permission_updated', $permission, 'Permission updated', $data);
        return redirect()->route('permissions.index')->with('success', 'Permission updated.');
    }

    public function destroy(Permission $permission)
    {
        $this->authorize('delete', $permission);
        $permissionId = $permission->id;
        $permissionData = $permission->toArray();
        $this->permissionService->deletePermission($permission);
        $this->activityLogService->log('permission_deleted', (object)['id' => $permissionId], 'Permission deleted', $permissionData);
        return redirect()->route('permissions.index')->with('success', 'Permission deleted.');
    }
}
