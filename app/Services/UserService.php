<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function createUser(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'workspace_id' => $data['workspace_id'] ?? null,
        ]);
        if (!empty($data['roles'])) {
            $user->syncRoles($data['roles']);
        }
        return $user;
    }

    public function updateUser(User $user, array $data): User
    {
        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'workspace_id' => $data['workspace_id'] ?? null,
        ]);
        if (!empty($data['password'])) {
            $user->update(['password' => Hash::make($data['password'])]);
        }
        $user->syncRoles($data['roles'] ?? []);
        return $user;
    }

    public function deleteUser(User $user): void
    {
        $user->delete();
    }
}
