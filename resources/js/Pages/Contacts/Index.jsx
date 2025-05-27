import React, { useState, useMemo, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Plus, Eye, Edit2, Trash2, CheckCircle2, XCircle, Search, Filter, RotateCcw, UserCircle, Briefcase, Phone, Mail, Building } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';

const getAvatarPlaceholder = (name) => {
    const colors = [
        'bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 
        'bg-purple-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
        'bg-cyan-500', 'bg-orange-500'
    ];
    if (!name || name.trim() === '') name = "?"; 
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];
    
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return {
        colorClass: color,
        initials: initials || name.charAt(0).toUpperCase()
    };
};


export default function ContactsIndex({ user, contacts, workspaces }) { 
    const { props } = usePage();
    const flash = props.flash || {};

    const queryParams = new URLSearchParams(window.location.search);
    const initialSearchText = queryParams.get('search') || '';

    const [searchText, setSearchText] = useState(initialSearchText);
    const [isListMounted, setIsListMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsListMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);
    
    const displayedContacts = useMemo(() => {
        let data = contacts && contacts.data ? [...contacts.data] : [];
        // This client-side filtering is active if searchText is not empty.
        // If your backend handles search via queryParams, this might filter an already filtered list.
        // Consider if this is the desired behavior or if displayedContacts should just be contacts.data
        // when server-side search is fully implemented and triggered by applySearch.
        if (searchText && data.length > 0 && !queryParams.has('search')) { // Only client-filter if not already server-filtered
            const s = searchText.toLowerCase();
            data = data.filter(c =>
                (c.name && c.name.toLowerCase().includes(s)) ||
                (c.email && c.email.toLowerCase().includes(s)) ||
                (c.phone && String(c.phone).includes(s)) ||
                (c.title && c.title.toLowerCase().includes(s)) ||
                (c.company && c.company.name && c.company.name.toLowerCase().includes(s))
            );
        }
        return data;
    }, [contacts, searchText, queryParams]);

    const handleSearchInputChange = (e) => {
        setSearchText(e.target.value);
    };

    // This function is now primarily triggered by pressing Enter in the search input.
    const applySearch = () => {
        const params = {};
        if (searchText) {
            params.search = searchText;
        }
        router.get(route('contacts.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true, // Avoids too many history entries for search
        });
    };
    
    const handleDelete = (contactId, contactName) => {
        if (confirm(`Are you sure you want to delete the contact "${contactName}"? This action cannot be undone.`)) {
            router.delete(route('contacts.destroy', contactId), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout user={user} title="Contacts">
            <Head title="Contacts" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="mb-6 flex flex-row  justify-between items-center gap-4">
                    {/* Add Contact Button on the left */}
                    
                    {/* Search Input on the right */}
                    <div className="relative w-full  sm:order-none sm:ml-auto">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md"
                            placeholder="Search contacts..."
                            value={searchText}
                            onChange={handleSearchInputChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault(); // Prevent form submission if it's part of a form
                                    applySearch();
                                }
                            }}
                        />
                    </div>

                    <Link
                        href={route('contacts.create')}
                        className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm font-medium order-1 sm:order-none"
                    >
                        <Plus size={18} className="mr-2 -ml-1" />
                        Add 
                    </Link>
                </div>

                {flash.success && (
                    <div className="mb-5 p-4 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-200 flex items-center shadow" role="alert">
                        <CheckCircle2 size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="mb-5 p-4 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-200 flex items-center shadow" role="alert">
                        <XCircle size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Removed the separate filter bar card */}

                {displayedContacts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {displayedContacts.map((contact, index) => {
                            const avatar = getAvatarPlaceholder(contact.name);
                            return (
                                <div 
                                    key={contact.id} 
                                    className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl p-5 flex flex-col justify-between transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1
                                                ${isListMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
                                    style={{ animationDelay: isListMounted ? `${index * 0.07}s` : '0s' }}
                                >
                                    <div>
                                        <div className="flex items-start mb-4">
                                            <div className={`w-14 h-14 ${avatar.colorClass} rounded-full flex items-center justify-center text-white font-semibold text-xl mr-4 flex-shrink-0 shadow-md`}>
                                                {avatar.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate" title={contact.name}>
                                                    {contact.name}
                                                </h3>
                                                {contact.title && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={contact.title}>
                                                        {contact.title}
                                                    </p>
                                                )}
                                                {contact.email && (
                                                    <a href={`mailto:${contact.email}`} className="text-xs text-blue-500 dark:text-blue-400 hover:underline truncate flex items-center mt-1" title={contact.email} onClick={(e) => e.stopPropagation()}>
                                                        <Mail size={12} className="mr-1.5 flex-shrink-0" /> {contact.email}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                                            {contact.phone && (
                                                <p className="flex items-center" title={`Phone: ${contact.phone}`}>
                                                    <Phone size={12} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                    {contact.phone}
                                                </p>
                                            )}
                                            {contact.company && contact.company.name && (
                                                <p className="flex items-center" title={`Company: ${contact.company.name}`}>
                                                    <Building size={12} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                    {contact.company.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-2.5">
                                        {/* <Link href={route('contacts.show', contact.id)} className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-300 transition-colors p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-700/50" title="View Contact">
                                            <Eye size={18} />
                                        </Link> */}
                                        <Link href={route('contacts.edit', contact.id)} className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-300 transition-colors p-1.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-700/50" title="Edit Contact">
                                            <Edit2 size={18} />
                                        </Link>
                                        <button onClick={() => handleDelete(contact.id, contact.name)} className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-300 transition-colors p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-700/50" title="Delete Contact">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                     <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl">
                        <Search size={56} className="mx-auto mb-5 text-gray-400 dark:text-gray-500" />
                        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                            {initialSearchText || searchText ? 'No contacts match your search.' : 'No contacts found.'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {initialSearchText || searchText ? 'Try adjusting your search term.' : 'Get started by adding a new contact.'}
                        </p>
                        {!(initialSearchText || searchText) && ( // Show "Add New Contact" only if there's no active search
                            <Link
                                href={route('contacts.create')}
                                className="mt-6 inline-flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                            >
                                <Plus size={16} className="mr-2" /> Add New Contact
                            </Link>
                        )}
                    </div>
                )}

                {contacts && contacts.links && contacts.data && contacts.data.length > 0 && (
                     <div className="mt-8">
                        <Pagination links={contacts.links} />
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
