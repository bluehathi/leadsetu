import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Select from 'react-select';

export default function ProspectListsShow({ user, prospectList, contactsInList, workspaceContacts, filters }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState({});
    const contactIdsInList = contactsInList.data ? contactsInList.data.map(c => c.id) : [];
    const availableContacts = workspaceContacts.filter(c => !contactIdsInList.includes(c.id));
    const selectOptions = availableContacts.map(c => ({ value: c.id, label: `${c.name} (${c.email})` }));

    const handleBulkAdd = (e) => {
        e.preventDefault();
        if (!selectedContacts.length) return;
        setAdding(true);
        router.post(route('prospect-lists.add-contacts', prospectList.id), {
            contact_ids: selectedContacts.map(c => c.value),
        }, {
            onFinish: () => {
                setAdding(false);
                setSelectedContacts([]);
            }
        });
    };

    const handleRemoveContact = (contactId) => {
        setRemoving(r => ({ ...r, [contactId]: true }));
        router.post(route('prospect-lists.remove-contacts', prospectList.id), {
            contact_ids: [contactId],
        }, {
            onFinish: () => setRemoving(r => ({ ...r, [contactId]: false }))
        });
    };

    return (
        <AuthenticatedLayout user={user} title={prospectList.name}>
            <Head title={prospectList.name} />
            <div className="py-8 px-4 sm:px-6 lg:px-8 w-full mx-auto max-w-4xl bg-white dark:bg-gray-900">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{prospectList.name}</h2>
                    <div className="flex gap-2">
                        <Link href={route('prospect-lists.edit', prospectList.id)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">Edit</Link>
                        <Link href={route('prospect-lists.index')} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm hover:shadow-md transition-all duration-150">Back</Link>
                    </div>
                </div>
                {flash.success && (
                    <div className="mb-5 p-4 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-200 flex items-center shadow" role="alert">
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="mb-5 p-4 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-200 flex items-center shadow" role="alert">
                        <span>{flash.error}</span>
                    </div>
                )}
                <div className="mb-6">
                    <div className="text-gray-700 dark:text-gray-300 mb-2"><span className="font-semibold">Description:</span> {prospectList.description || <span className="italic text-gray-400">No description</span>}</div>
                    <div className="text-gray-700 dark:text-gray-300 mb-2"><span className="font-semibold">Contacts in this list:</span> {prospectList.contacts_count}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-5">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Contacts</h3>
                    <div className="mb-4">
                        <form onSubmit={handleBulkAdd} className="flex flex-col md:flex-row gap-2 items-end md:items-center">
                            <div className="flex-1 min-w-[220px]">
                                <Select
                                    isMulti
                                    options={selectOptions}
                                    value={selectedContacts}
                                    onChange={setSelectedContacts}
                                    placeholder="Select contacts to add..."
                                    classNamePrefix="react-select"
                                    className="w-full"
                                    isDisabled={adding}
                                />
                            </div>
                            <button type="submit" disabled={!selectedContacts.length || adding} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 min-w-[100px]">{adding ? 'Adding...' : `Add ${selectedContacts.length > 1 ? 'Contacts' : 'Contact'}`}</button>
                        </form>
                    </div>
                    {contactsInList.data && contactsInList.data.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {contactsInList.data.map(contact => (
                                <li key={contact.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-gray-100">{contact.name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{contact.email}</div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveContact(contact.id)}
                                        disabled={removing[contact.id]}
                                        className="mt-2 sm:mt-0 px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-medium disabled:opacity-60"
                                    >
                                        {removing[contact.id] ? 'Removing...' : 'Remove'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400 italic">No contacts in this list.</div>
                    )}
                    {contactsInList.links && contactsInList.links.length > 0 && (
                        <div className="mt-4">
                            {/* You can use your Pagination component here if available */}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
