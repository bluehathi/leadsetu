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


export default function ContactsIndex({ user, contacts: initialContacts, workspaces, filters: initialFilters }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const contacts = props.contacts || initialContacts; // Prefer props if updated by Inertia partial reload
    const filters = props.filters || initialFilters; // Prefer props for filters

    const [searchText, setSearchText] = useState(filters?.search || '');
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'created_at');
    const [sortDirection, setSortDirection] = useState(filters?.sort_direction || 'desc');

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

    useEffect(() => {
        setSearchText(filters?.search || '');
        setSortBy(filters?.sort_by || 'created_at');
        setSortDirection(filters?.sort_direction || 'desc');
    }, [filters]);

    // Data to display is now directly from props, as server handles filtering/sorting
    const displayedContacts = contacts?.data || [];

    const applySearch = () => {
        fetchContacts({ search: searchText, page: 1 }); // Reset to page 1 on new search
    };

    const handleSort = (newSortBy) => {
        const newSortDirection = sortBy === newSortBy && sortDirection === 'asc' ? 'desc' : 'asc';
        fetchContacts({ sort_by: newSortBy, sort_direction: newSortDirection });
    };

    const fetchContacts = (params = {}) => {
        const query = {
            search: params.search !== undefined ? params.search : searchText,
            sort_by: params.sort_by !== undefined ? params.sort_by : sortBy,
            sort_direction: params.sort_direction !== undefined ? params.sort_direction : sortDirection,
            page: params.page !== undefined ? params.page : (new URLSearchParams(window.location.search)).get('page') || 1,
            // Add other filters like per_page if you have them
        };

        router.get(route('contacts.index'), query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleDelete = (contactId, contactName) => {
        if (confirm(`Are you sure you want to delete the contact "${contactName}"? This action cannot be undone.`)) {
            router.delete(route('contacts.destroy', contactId), {
                preserveScroll: true,
                // onSuccess: () => fetchContacts(), // Optionally refetch to ensure data consistency
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
                                sortBy={sortBy}
                                sortDirection={sortDirection}
                                onSort={handleSort}
                                isListMounted={isListMounted}
                            />
                        )}
                        {/* List View */}
                        {viewMode === 'list' && (
                            <ContactList
                                displayedContacts={displayedContacts}
                                getAvatarPlaceholder={getAvatarPlaceholder}
                                handleDelete={handleDelete}
                                sortBy={sortBy}
                                sortDirection={sortDirection}
                                onSort={handleSort}
                                isListMounted={isListMounted}
                            />
                        )}
                    </>
                ) : (
                     <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl">
                        <Search size={56} className="mx-auto mb-5 text-gray-400 dark:text-gray-500" />
                        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                            {searchText ? 'No contacts match your search.' : 'No contacts found.'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {searchText ? 'Try adjusting your search term or clear the search.' : 'Get started by adding a new contact.'}
                        </p>
                        {!searchText && (
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