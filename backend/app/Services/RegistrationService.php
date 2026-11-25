<?php

namespace App\Services;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;
use Throwable;

class RegistrationService
{
    public const OWNER_ROLE = 'WorkSpace Owner';

    /** Creates a new workspace and its first user (the workspace owner) atomically. */
    public function register(array $data): User
    {
        $user = DB::transaction(function () use ($data) {
            $workspace = Workspace::create([
                'name' => $data['name'] . "'s Workspace",
                'description' => null,
            ]);

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'workspace_id' => $workspace->id,
            ]);

            $workspace->owners()->attach($user->id);
            // Only the shared system role is visible to anonymous visitors, so a tenant can never shadow it.
            $user->assignRole(Role::findByName(self::OWNER_ROLE, 'web'));

            return $user;
        });

        $this->sendVerification($user);

        return $user;
    }

    /** A mail outage must not block sign-up; the user can request another link later. */
    public function sendVerification(User $user): void
    {
        try {
            $user->sendEmailVerificationNotification();
        } catch (Throwable $e) {
            Log::warning("Could not send verification email to user {$user->id}: " . $e->getMessage());
        }
    }
}
