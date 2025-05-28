<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Inertia\Inertia;
use Auth;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::with('permissions')->get();
        $permissions = Permission::all();
        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'permissions' => $permissions,
            'user' => Auth::user()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);
        $role = Role::create(['name' => $request->name]);
        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }
        return redirect()->route('roles.index')->with('success', 'Role created.');
    }

    public function update(Request $request, Role $role)
    {
        // Prevent editing the Admin role
        if ($role->name === 'Admin') {
            return redirect()->route('roles.index')->with('error', 'The Admin role cannot be edited.');
        }
        $request->validate([
            'name' => 'required|unique:roles,name,' . $role->id,
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);
        $role->update(['name' => $request->name]);
        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }
        return redirect()->route('roles.index')->with('success', 'Role updated.');
    }

    public function destroy(Role $role)
    {
        // Prevent deleting default roles
        $defaultRoles = ['Admin', 'Manager', 'Sales', 'Viewer'];
        if (in_array($role->name, $defaultRoles)) {
            return redirect()->route('roles.index')->with('error', 'Default roles cannot be deleted.');
        }
        $role->delete();
        return redirect()->route('roles.index')->with('success', 'Role deleted.');
    }

    public function create()
    {
        $permissions = Permission::all();
        return Inertia::render('Roles/Create', [
            'permissions' => $permissions,
            'user' => Auth::user()
        ]);
    }

    public function edit(Role $role)
    {
        $role->load('permissions');
        $permissions = Permission::all();
        return Inertia::render('Roles/Edit', [
            'role' => $role,
            'permissions' => $permissions,
            'user' => Auth::user()
        ]);
    }
}
