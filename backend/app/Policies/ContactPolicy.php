<?php

namespace App\Policies;

use App\Models\Contact;
use App\Models\User;
use App\Policies\Concerns\ChecksWorkspace;

class ContactPolicy
{
    use ChecksWorkspace;

    public function viewAny(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('view_contacts');
    }

    public function view(User $user, Contact $contact): bool
    {
        return $this->sameWorkspace($user, $contact) && $user->can('view_contacts');
    }

    public function create(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('create_contacts');
    }

    public function update(User $user, Contact $contact): bool
    {
        return $this->sameWorkspace($user, $contact) && $user->can('edit_contacts');
    }

    public function delete(User $user, Contact $contact): bool
    {
        return $this->sameWorkspace($user, $contact) && $user->can('delete_contacts');
    }
}
