<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Inertia\Inertia;
use Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class PermissionController extends Controller
{
    use AuthorizesRequests;

    public function index()
    {
        $this->authorize('viewAny', Permission::class);
        $permissions = Permission::all();
        return Inertia::render('Permissions/Index', ['permissions' => $permissions]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Permission::class);
        $request->validate(['name' => 'required|unique:permissions,name']);
        Permission::create(['name' => $request->name]);
        return redirect()->route('permissions.index')->with('success', 'Permission created.');
    }

    public function update(Request $request, Permission $permission)
    {
        $this->authorize('update', $permission);
        $request->validate(['name' => 'required|unique:permissions,name,' . $permission->id]);
        $permission->update(['name' => $request->name]);
        return redirect()->route('permissions.index')->with('success', 'Permission updated.');
    }

    public function destroy(Permission $permission)
    {
        $this->authorize('delete', $permission);
        $permission->delete();
        return redirect()->route('permissions.index')->with('success', 'Permission deleted.');
    }
}
