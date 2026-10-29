<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PermissionResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\Permission\Models\Permission;

/**
 * Permissions are defined by the application (PermissionSeeder) and are global, so
 * tenants can only read them. Creating or deleting one would affect every workspace.
 */
class PermissionController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Permission::class);

        return PermissionResource::collection(Permission::query()->orderBy('name')->get());
    }
}
