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

class PermissionController extends Controller
{
    use AuthorizesRequests;

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
        $permission = Permission::create($data);
        return redirect()->route('permissions.index')->with('success', 'Permission created.');
    }

    public function update(UpdatePermissionRequest $request, Permission $permission)
    {
        $this->authorize('update', $permission);
        $data = $request->validated();
        $permission->update($data);
        return redirect()->route('permissions.index')->with('success', 'Permission updated.');
    }

    public function destroy(Permission $permission)
    {
        $this->authorize('delete', $permission);
        $permission->delete();
        return redirect()->route('permissions.index')->with('success', 'Permission deleted.');
    }
}
