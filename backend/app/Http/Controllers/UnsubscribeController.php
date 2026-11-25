<?php

namespace App\Http\Controllers;

use App\Models\Contact;

/** Public, signed one-click unsubscribe link included in every campaign email. */
class UnsubscribeController extends Controller
{
    public function __invoke(int $contact)
    {
        // Visitors are anonymous, so look the contact up outside the tenant scope; the signature proves the link is ours.
        Contact::withoutGlobalScopes()->whereKey($contact)->whereNull('unsubscribed_at')->update(['unsubscribed_at' => now()]);

        return response('<!doctype html><meta charset="utf-8"><title>Unsubscribed</title>'
            . '<p style="font-family:sans-serif;margin:3rem auto;max-width:28rem">You have been unsubscribed and will no longer receive our emails.</p>');
    }
}
