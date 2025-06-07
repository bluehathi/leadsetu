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

class RoleController extends Controller
{
    use AuthorizesRequests;

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
        $role = Role::create($data);
        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }
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
        $role->update($data);
        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }
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
        $role->delete();
        return redirect()->route('roles.index')->with('success', 'Role deleted.');
    }
}
