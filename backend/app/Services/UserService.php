<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UserService
{
    private const SORTABLE = ['name', 'email', 'created_at'];

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = User::query()
            ->with('roles')
            ->where('workspace_id', Auth::user()->workspace_id);

        if (filled($filters['search'] ?? null)) {
            $term = '%' . $filters['search'] . '%';
            $query->where(fn ($q) => $q->where('name', 'like', $term)->orWhere('email', 'like', $term));
        }

        $sort = $filters['sort'] ?? 'name';
        $column = ltrim($sort, '-');
        $query->orderBy(in_array($column, self::SORTABLE, true) ? $column : 'name', str_starts_with($sort, '-') ? 'desc' : 'asc');

        return $query->paginate(min(max($perPage, 1), 100));
    }

    /** The new user always joins the creator's workspace; workspace_id is never taken from input. */
    public function createUser(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'workspace_id' => Auth::user()->workspace_id,
            ]);
            $user->syncRoles($data['roles'] ?? []);

            return $user;
        });
    }

    public function updateUser(User $user, array $data): User
    {
        // Changing your own roles could lock you out (or be used to probe escalation).
        if (array_key_exists('roles', $data) && Auth::user()->is($user)) {
            throw ValidationException::withMessages(['roles' => ['You cannot change your own roles.']]);
        }

        return DB::transaction(function () use ($user, $data) {
            $user->update(array_filter(
                ['name' => $data['name'] ?? null, 'email' => $data['email'] ?? null, 'password' => $data['password'] ?? null],
                fn ($v) => $v !== null,
            ));
            if (array_key_exists('roles', $data)) {
                $user->syncRoles($data['roles']);
            }

            return $user;
        });
    }

    public function deleteUser(User $user): void
    {
        $user->delete();
    }
}
