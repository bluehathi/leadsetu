<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\Organization; // If using organization association
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ContactController extends Controller
{
    public function index()
    {
        $contacts = Contact::with('organization') // Load organization if needed
            ->paginate(10); // Adjust pagination as needed

        return Inertia::render('Contacts/Index', [
            'contacts' => $contacts,
        ]);
    }

    public function create()
    {
        $organizations = Organization::all(); // If using organization association

        return Inertia::render('Contacts/Create', [
            'organizations' => $organizations, // Pass to the create view
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'organization_id' => 'nullable|exists:organizations,id', // Validate if needed
            'title' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        Contact::create($request->all());

        return redirect()->route('contacts.index')
            ->with('success', 'Contact created successfully.');
    }

    public function show(Contact $contact)
    {
        return Inertia::render('Contacts/Show', [
            'contact' => $contact,
        ]);
    }

    public function edit(Contact $contact)
    {
        $organizations = Organization::all(); // If using organization association

        return Inertia::render('Contacts/Edit', [
            'contact' => $contact,
            'organizations' => $organizations, // Pass to the edit view
        ]);
    }

    public function update(Request $request, Contact $contact)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'organization_id' => 'nullable|exists:organizations,id', // Validate if needed
            'title' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $contact->update($request->all());

        return redirect()->route('contacts.index')
            ->with('success', 'Contact updated successfully.');
    }

    public function destroy(Contact $contact)
    {
        $contact->delete();

        return redirect()->route('contacts.index')
            ->with('success', 'Contact deleted successfully.');
    }
}