<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Inertia\Inertia;
use Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Services\RoleService;
use App\Services\ActivityLogService;

class RoleController extends Controller
{
    use AuthorizesRequests;

    protected $roleService;
    protected $activityLogService;

    public function __construct(RoleService $roleService, ActivityLogService $activityLogService)
    {
        $this->roleService = $roleService;
        $this->activityLogService = $activityLogService;
    }

    public function index()
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::with('permissions')->get();
        $permissions = Permission::all();
        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function create()
    {
        $this->authorize('create', Role::class);

        $permissions = Permission::all();
        return Inertia::render('Roles/Create', [
            'permissions' => $permissions,
        ]);
    }

    public function store(StoreRoleRequest $request)
    {
        $this->authorize('create', Role::class);
        $data = $request->validated();
        $role = $this->roleService->createRole($data);
        $this->activityLogService->log('role_created', $role, 'Role created', $data);
        return redirect()->route('roles.index')->with('success', 'Role created.');
    }

    public function show(Role $role)
    {
        $this->authorize('view', $role);

        $role->load('permissions');
        $permissions = Permission::all();
        return Inertia::render('Roles/Show', [
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    public function edit(Role $role)
    {
        $this->authorize('update', $role);

        $role->load('permissions');
        $permissions = Permission::all();
        return Inertia::render('Roles/Edit', [
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    public function update(UpdateRoleRequest $request, Role $role)
    {
        $this->authorize('update', $role);
        $data = $request->validated();
        $this->roleService->updateRole($role, $data);
        $this->activityLogService->log('role_updated', $role, 'Role updated', $data);
        return redirect()->route('roles.index')->with('success', 'Role updated.');
    }

    public function destroy(Role $role)
    {
        $this->authorize('delete', $role);

        // Prevent deleting default roles
        $defaultRoles = ['Admin', 'Manager', 'Sales', 'Viewer'];
        if (in_array($role->name, $defaultRoles)) {
            return redirect()->route('roles.index')->with('error', 'Default roles cannot be deleted.');
        }
        $roleId = $role->id;
        $roleData = $role->toArray();
        $this->roleService->deleteRole($role);
        $this->activityLogService->log('role_deleted', (object)['id' => $roleId], 'Role deleted', $roleData);
        return redirect()->route('roles.index')->with('success', 'Role deleted.');
    }
}
