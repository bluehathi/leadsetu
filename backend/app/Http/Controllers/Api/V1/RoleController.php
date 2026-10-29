<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\AppliesResourcePolicy;
use App\Http\Controllers\Controller;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use App\Models\Role;
use App\Services\ActivityLogService;
use App\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;

class RoleController extends Controller implements HasMiddleware
{
    use AppliesResourcePolicy;

    public function __construct(protected RoleService $roles, protected ActivityLogService $audit)
    {
    }

    public static function middleware(): array
    {
        return static::resourcePolicy(Role::class, 'role');
    }

    public function index(): AnonymousResourceCollection
    {
        return RoleResource::collection($this->roles->list());
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = $this->roles->createRole($request->validated());
        $this->audit->log('role_created', $role, 'Role created', ['permissions' => $request->input('permissions', [])]);

        return (new RoleResource($role->load('permissions')))->response()->setStatusCode(201);
    }

    public function show(Role $role): RoleResource
    {
        return new RoleResource($role->load('permissions')->loadCount('users'));
    }

    public function update(UpdateRoleRequest $request, Role $role): RoleResource
    {
        $role = $this->roles->updateRole($role, $request->validated());
        $this->audit->log('role_updated', $role, 'Role updated', $request->validated());

        return new RoleResource($role->load('permissions'));
    }

    public function destroy(Role $role): JsonResponse
    {
        $this->roles->deleteRole($role);
        $this->audit->log('role_deleted', $role, 'Role deleted');

        return response()->json(null, 204);
    }
}
