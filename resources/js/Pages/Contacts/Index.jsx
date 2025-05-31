import React, { useState, useMemo, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { 
    Plus, RotateCcw, UserCircle, Briefcase, Phone, Mail, Building, LayoutGrid, List, Send
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import FlashMessages from './Partials/FlashMessages';
import Toolbar from './Partials/Toolbar';
import SearchInput from './Partials/SearchInput';
import ContactGrid from './Partials/ContactGrid';
import ContactList from './Partials/ContactList';
import { getAvatarPlaceholder } from '@/Utils/Avatar';


export default function ContactsIndex({ user, contacts, workspaces }) { 
    const { props } = usePage();
    const flash = props.flash || {};

    const queryParams = new URLSearchParams(window.location.search);
    const initialSearchText = queryParams.get('search') || '';

    const [searchText, setSearchText] = useState(initialSearchText);
    const [isListMounted, setIsListMounted] = useState(false);
    // View mode: persist in localStorage
    const [viewMode, setViewMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('contactsViewMode');
            if (saved === 'grid' || saved === 'list') return saved;
        }
        return 'grid';
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('contactsViewMode', viewMode);
        }
    }, [viewMode]);

    useEffect(() => {
        const timer = setTimeout(() => setIsListMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);
    
    const displayedContacts = useMemo(() => {
        let data = contacts && contacts.data ? [...contacts.data] : [];
        if (searchText && data.length > 0 && !queryParams.has('search')) {
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

    const applySearch = () => {
        const params = {};
        if (searchText) {
            params.search = searchText;
        }
        router.get(route('contacts.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };
    
    const handleDelete = (contactId, contactName) => {
        if (confirm(`Are you sure you want to delete the contact "${contactName}"? This action cannot be undone.`)) {
            router.delete(route('contacts.destroy', contactId), {
                preserveScroll: true,
            });
        }
    };

    const baseButtonClasses = "p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors duration-200";
    const activeViewButtonClasses = "bg-blue-600 text-white focus:ring-blue-500 shadow-md";
    const inactiveViewButtonClasses = "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-400";

    return (
        <AuthenticatedLayout user={user} title="Contacts">
            <Head title="Contacts" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    {/* Left side: Add Contact, Import, View Toggles */}
                    <Toolbar
                        setViewMode={setViewMode}
                        viewMode={viewMode}
                        baseButtonClasses={baseButtonClasses}
                        activeViewButtonClasses={activeViewButtonClasses}
                        inactiveViewButtonClasses={inactiveViewButtonClasses}
                    />
                    {/* Right side: Search Input */}
                    <SearchInput
                        searchText={searchText}
                        setSearchText={setSearchText}
                        applySearch={applySearch}
                    />
                </div>

                <FlashMessages flash={flash} />

                {displayedContacts.length > 0 ? (
                    <>
                        {/* Grid View */}
                        {viewMode === 'grid' && (
                            <ContactGrid
                                displayedContacts={displayedContacts}
                                getAvatarPlaceholder={getAvatarPlaceholder}
                                handleDelete={handleDelete}
                                isListMounted={isListMounted}
                            />
                        )}
                        {/* List View */}
                        {viewMode === 'list' && (
                            <ContactList
                                displayedContacts={displayedContacts}
                                getAvatarPlaceholder={getAvatarPlaceholder}
                                handleDelete={handleDelete}
                                isListMounted={isListMounted}
                            />
                        )}
                    </>
                ) : (
                     <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl">
                        <Search size={56} className="mx-auto mb-5 text-gray-400 dark:text-gray-500" />
                        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                            {initialSearchText || searchText ? 'No contacts match your search.' : 'No contacts found.'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {initialSearchText || searchText ? 'Try adjusting your search term.' : 'Get started by adding a new contact.'}
                        </p>
                        {!(initialSearchText || searchText) && (
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