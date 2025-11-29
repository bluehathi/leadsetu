<?php

namespace App\Services;

use App\Models\Contact;
use Illuminate\Support\Facades\Auth;

class ContactService
{
    public function createContact(array $data): Contact
    {
        $user = Auth::user();
        $data['workspace_id'] = $user->workspace_id;
        return Contact::create($data);
    }

    public function updateContact(Contact $contact, array $data): Contact
    {
        $contact->update($data);
        return $contact;
    }

    public function deleteContact(Contact $contact): void
    {
        $contact->delete();
    }
}
