import React, { useState, useMemo, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import {
    Plus, RotateCcw, UserCircle, Briefcase, Phone, Mail, Building, LayoutGrid, List, Send, Users, Search, ListPlus
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import FlashMessages from './Partials/FlashMessages';
import Toolbar from './Partials/Toolbar';
import SearchInput from './Partials/SearchInput';
import ContactGrid from './Partials/ContactGrid';
import ContactList from './Partials/ContactList';
import AddContactsToProspectListModal from './Partials/AddContactsToProspectListModal';
import { getAvatarPlaceholder } from '@/Utils/Avatar';
import axios from 'axios';


export default function ContactsIndex({ user, contacts: initialContacts, workspaces, filters: initialFilters }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const contacts = props.contacts || initialContacts; // Prefer props if updated by Inertia partial reload
    const filters = props.filters || initialFilters; // Prefer props for filters

    const [searchText, setSearchText] = useState(filters?.search || '');
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'created_at');
    const [sortDirection, setSortDirection] = useState(filters?.sort_direction || 'desc');

    const [selectedContactIds, setSelectedContactIds] = useState([]);
    const [isProspectModalOpen, setIsProspectModalOpen] = useState(false);
    const [userProspectLists, setUserProspectLists] = useState([]); // Will hold lists fetched for the modal
    const [initialSelectedListIds, setInitialSelectedListIds] = useState([]); // For pre-selecting lists in the modal

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

    const handleSelectContact = (contactId) => {
        setSelectedContactIds(prevSelected =>
            prevSelected.includes(contactId)
                ? prevSelected.filter(id => id !== contactId)
                : [...prevSelected, contactId]
        );
    };

    const openProspectModalAndFetchLists = async (idsToSelect = selectedContactIds) => {
        if (idsToSelect.length === 0) {
            alert("Please select at least one contact.");
            return;
        }
        setSelectedContactIds(idsToSelect);
        try {
            const [listsRes, contactListsRes] = await Promise.all([
                axios.get(route('prospect-lists.modal-list')),
                idsToSelect.length === 1
                    ? axios.get(route('prospect-lists.contact-lists', idsToSelect[0]))
                    : Promise.resolve({ data: { list_ids: [] } })
            ]);
            setUserProspectLists(listsRes.data.lists);
            setInitialSelectedListIds((contactListsRes.data.list_ids || []).map(String));
            setIsProspectModalOpen(true);
        } catch (error) {
            console.error("Failed to fetch prospect lists:", error);
            alert("Could not load prospect lists. Please try again.");
        }
    };

    const handleAddToPlaylistClickForCard = (contactId) => {
        openProspectModalAndFetchLists([contactId]);
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
                    {/* Add to Prospect List Button - appears when contacts are selected (for list view primarily) */}
                    {/* {selectedContactIds.length > 0 && viewMode === 'list' && ( // Show only in list view or if you want it globally
                        <button
                            onClick={() => openProspectModalAndFetchLists()}
                            className="ml-auto sm:ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <Users size={16} className="mr-2" />
                            Add to List ({selectedContactIds.length})
                        </button>
                    )} */}
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
                                onAddToPlaylistClick={handleAddToPlaylistClickForCard} // Pass the handler
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
                                selectedContactIds={selectedContactIds} // For checkbox selection in list view
                                onSelectContact={handleSelectContact}   // For checkbox selection in list view
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
                <AddContactsToProspectListModal
                    isOpen={isProspectModalOpen}
                    onClose={() => setIsProspectModalOpen(false)}
                    contactIds={selectedContactIds}
                    userProspectLists={userProspectLists}
                    initialSelectedListIds={initialSelectedListIds}
                    onListUpdated={() => {
                        setSelectedContactIds([]);
                        // Optionally, show a flash message
                        // router.reload({ only: ['flash'] });
                    }}
                />
            </div>
        </AuthenticatedLayout>
    );
}