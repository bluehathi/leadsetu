<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Contact;

class ContactPolicy
{
    public function viewAny(User $user)
    {
        return $user->can('view_contacts');
    }

    public function view(User $user, Contact $contact)
    {
        return $user->workspace_id === $contact->workspace_id && $user->can('view_contacts');
    }

    public function create(User $user)
    {
        return $user->can('create_contacts');
    }

    public function update(User $user, Contact $contact)
    {
        return $user->workspace_id === $contact->workspace_id &&
            ($user->id === $contact->user_id || $user->can('edit_contacts'));
    }

    public function delete(User $user, Contact $contact)
    {
        return $user->workspace_id === $contact->workspace_id &&
            ($user->id === $contact->user_id || $user->can('delete_contacts'));
    }
}
