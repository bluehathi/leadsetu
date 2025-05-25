import React, { useState, useMemo } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Plus, Eye, Pencil, Trash2, CheckCircle2, XCircle, Search } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import Select from 'react-select';

export default function ContactsIndex({ user, contacts, workspaces }) {
    const { props } = usePage();
    const flash = props.flash || {};

    const [searchText, setSearchText] = useState('');
    // const [workspaceMulti, setWorkspaceMulti] = useState([]); // Uncomment if workspace filter is needed

    const filteredContacts = useMemo(() => {
        let data = contacts && contacts.data ? [...contacts.data] : [];

        if (searchText) {
            const s = searchText.toLowerCase();
            data = data.filter(c =>
                (c.name && c.name.toLowerCase().includes(s)) ||
                (c.email && c.email.toLowerCase().includes(s)) ||
                (c.phone && c.phone.includes(s)) ||
                (c.title && c.title.toLowerCase().includes(s))
            );
        }

        return data;
    }, [contacts, searchText]);

    const applyFilters = () => {
        const params = {};
        if (searchText) params.search = searchText;
        // if (workspaceMulti && workspaceMulti.length > 0) params.workspace = workspaceMulti.map(w => w.value); // Uncomment if filter is used
        router.get(window.location.pathname, params, { preserveState: true });
    };

    const resetFilters = () => {
        setSearchText('');
        // setWorkspaceMulti([]); // Uncomment if filter is used
        router.get(window.location.pathname, {}, { preserveState: true });
    };

    return (
        <AuthenticatedLayout user={user} title="Contacts">
            <Head title="Contacts" />
            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                        Manage Contacts
                    </h1>
                    <div className="flex gap-2 items-center">
                        <Link
                            href={route('contacts.create')}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                        >
                            <Plus size={18} className="mr-2 -ml-1" />
                            Add New Contact
                        </Link>
                    </div>
                </div>

                {flash.success && (
                    <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 rounded-md flex items-center justify-between" role="alert">
                        <div className="flex items-center">
                            <CheckCircle2 size={20} className="mr-2 flex-shrink-0" aria-hidden="true" />
                            <span>{flash.success}</span>
                        </div>
                    </div>
                )}

                {flash.error && (
                    <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md flex items-center justify-between" role="alert">
                        <div className="flex items-center">
                            <XCircle size={20} className="mr-2 flex-shrink-0" aria-hidden="true" />
                            <span>{flash.error}</span>
                        </div>
                    </div>
                )}

                <div className="mb-6 bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Search size={16} />
                        <input
                            type="text"
                            className="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm px-3 py-2 min-w-[180px]"
                            placeholder="Search name, email, phone..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                        />
                    </div>
                    {/*
                    <div className="flex items-center gap-2">
                        <Select
                            isMulti
                            options={workspaces.map(ws => ({ value: ws.id, label: ws.name }))}
                            value={workspaceMulti}
                            onChange={setWorkspaceMulti}
                            classNamePrefix="react-select"
                            placeholder="Filter by workspace..."
                        />
                    </div>
                    */}
                    <button
                        type="button"
                        className="ml-2 px-4 py-2 rounded-full border border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-800 transition"
                        onClick={applyFilters}
                    >
                        Apply Filters
                    </button>
                    <button
                        type="button"
                        className="ml-2 px-4 py-2 rounded-full border border-gray-400 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        onClick={resetFilters}
                    >
                        Reset Filters
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredContacts.map(contact => (
                                    <tr key={contact.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{contact.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{contact.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{contact.phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{contact.company ? contact.company.name : '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{contact.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex items-center justify-center space-x-2">
                                                <Link href={route('contacts.show', contact.id)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" title="View">
                                                    <Eye size={16} />
                                                </Link>
                                                <Link href={route('contacts.edit', contact.id)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300" title="Edit">
                                                    <Pencil size={16} />
                                                </Link>
                                                <Link href={route('contacts.destroy', contact.id)} method="delete" as="button" className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="Delete" onBefore={() => confirm('Are you sure you want to delete this contact?')}>
                                                    <Trash2 size={16} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {contacts.links && contacts.data.length > 0 && (
                        <Pagination links={contacts.links} />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}