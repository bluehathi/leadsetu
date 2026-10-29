<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\AppliesResourcePolicy;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\ManagedUserResource;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;

class UserController extends Controller implements HasMiddleware
{
    use AppliesResourcePolicy;

    public function __construct(protected UserService $users, protected ActivityLogService $audit)
    {
    }

    public static function middleware(): array
    {
        return static::resourcePolicy(User::class, 'user');
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return ManagedUserResource::collection(
            $this->users->paginate($request->only(['search', 'sort']), (int) $request->integer('per_page', 15))
        );
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->users->createUser($request->validated());
        $this->audit->log('user_created', $user, 'User created', ['roles' => $request->input('roles', [])]);

        return (new ManagedUserResource($user->load('roles')))->response()->setStatusCode(201);
    }

    public function show(User $user): ManagedUserResource
    {
        return new ManagedUserResource($user->load('roles'));
    }

    public function update(UpdateUserRequest $request, User $user): ManagedUserResource
    {
        $user = $this->users->updateUser($user, $request->validated());
        $this->audit->log('user_updated', $user, 'User updated', ['fields' => array_keys($request->validated())]);

        return new ManagedUserResource($user->load('roles'));
    }

    public function destroy(User $user): JsonResponse
    {
        $this->users->deleteUser($user);
        $this->audit->log('user_deleted', $user, 'User deleted');

        return response()->json(null, 204);
    }
}
