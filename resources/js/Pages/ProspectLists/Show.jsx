import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'; // Assuming this path is correct
import Select from 'react-select';
import { CheckCircle2, AlertTriangle, Info, Trash2, Edit3, PlusCircle, ListChecks, Users, FileText } from 'lucide-react'; // Lucide React icons

// Helper component for form field errors (if needed, though not directly used in this component's main form)
// const InputError = ({ message, className = '' }) => {
//     return message ? <p className={`text-sm text-red-600 dark:text-red-500 mt-1.5 ${className}`}>{message}</p> : null;
// };

// Simple Pagination (if you don't have a dedicated component)
const SimplePagination = ({ links }) => {
    if (!links || links.length <= 3) return null; // Hide if only prev, current, next or less

    return (
        <nav className="mt-6 flex items-center justify-center space-x-1">
            {links.map((link, index) => (
                <Link
                    key={index}
                    href={link.url || '#'}
                    className={`px-3 py-2 text-sm rounded-md
                        ${link.active ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                        ${!link.url ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : ''}
                        transition-colors duration-150 ease-in-out`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                    as={!link.url ? 'span' : 'a'} // Render as span if no URL
                />
            ))}
        </nav>
    );
};


export default function ProspectListsShow({ user, prospectList, contactsInList, workspaceContacts, filters }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [isAddingContacts, setIsAddingContacts] = useState(false); // More descriptive name
    const [removingContactId, setRemovingContactId] = useState(null); // Track single removing contact

    // Memoize or compute these outside render if they are expensive, though likely fine here
    const contactIdsInList = React.useMemo(() => contactsInList.data ? contactsInList.data.map(c => c.id) : [], [contactsInList.data]);
    const availableContacts = React.useMemo(() => workspaceContacts.filter(c => !contactIdsInList.includes(c.id)), [workspaceContacts, contactIdsInList]);

    const selectOptions = React.useMemo(() => availableContacts.map(c => ({
        value: c.id,
        label: `${c.name} (${c.email})`
    })), [availableContacts]);

    const handleBulkAdd = (e) => {
        e.preventDefault();
        if (!selectedContacts.length) return;
        setIsAddingContacts(true);
        router.post(route('prospect-lists.add-contacts', prospectList.id), {
            contact_ids: selectedContacts.map(c => c.value),
        }, {
            preserveScroll: true, // Keep scroll position
            onSuccess: () => setSelectedContacts([]), // Clear selection on success
            onFinish: () => setIsAddingContacts(false),
        });
    };

    const handleRemoveContact = (contactId) => {
        setRemovingContactId(contactId);
        router.post(route('prospect-lists.remove-contacts', prospectList.id), {
            contact_ids: [contactId],
        }, {
            preserveScroll: true,
            onFinish: () => setRemovingContactId(null),
        });
    };

    // Custom styles for react-select to match Tailwind theme
    const reactSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: 'var(--rs-control-bg)',
            borderColor: state.isFocused ? 'var(--rs-control-border-focus)' : 'var(--rs-control-border)',
            boxShadow: state.isFocused ? '0 0 0 1px var(--rs-control-border-focus)' : provided.boxShadow,
            '&:hover': {
                borderColor: 'var(--rs-control-border-hover)',
            },
            borderRadius: '0.375rem', // rounded-md
            minHeight: '42px', // Consistent height with buttons
            paddingLeft: '0.25rem',
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: 'var(--rs-menu-bg)',
            borderRadius: '0.375rem',
            zIndex: 20, // Ensure menu is above other elements
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? 'var(--rs-option-selected-bg)' : state.isFocused ? 'var(--rs-option-focused-bg)' : 'var(--rs-option-bg)',
            color: state.isSelected ? 'var(--rs-option-selected-color)' : 'var(--rs-option-color)',
            '&:active': {
                backgroundColor: 'var(--rs-option-active-bg)',
            },
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: 'var(--rs-multiValue-bg)',
            borderRadius: '0.25rem',
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: 'var(--rs-multiValue-label-color)',
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: 'var(--rs-multiValue-remove-color)',
            '&:hover': {
                backgroundColor: 'var(--rs-multiValue-remove-hover-bg)',
                color: 'var(--rs-multiValue-remove-hover-color)',
            },
        }),
        placeholder: (provided) => ({
            ...provided,
            color: 'var(--rs-placeholder-color)',
        }),
        input: (provided) => ({
            ...provided,
            color: 'var(--rs-input-color)',
        }),
    };

    return (
        <AuthenticatedLayout
            user={user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Prospect List: {prospectList.name}
                </h2>
            }
        >
            <Head title={prospectList.name} />
            {/* Define CSS variables for react-select theming */}
            <style>{`
                :root {
                    --rs-control-bg: rgb(249 250 251 / var(--tw-bg-opacity)); /* gray-50 */
                    --rs-control-border: rgb(209 213 219 / var(--tw-border-opacity)); /* gray-300 */
                    --rs-control-border-focus: rgb(99 102 241 / var(--tw-border-opacity)); /* indigo-500 */
                    --rs-control-border-hover: rgb(156 163 175 / var(--tw-border-opacity)); /* gray-400 */
                    --rs-menu-bg: white;
                    --rs-option-selected-bg: rgb(79 70 229 / var(--tw-bg-opacity)); /* indigo-600 */
                    --rs-option-selected-color: white;
                    --rs-option-focused-bg: rgb(224 231 255 / var(--tw-bg-opacity)); /* indigo-100 */
                    --rs-option-bg: white;
                    --rs-option-color: rgb(17 24 39 / var(--tw-text-opacity)); /* gray-900 */
                    --rs-option-active-bg: rgb(199 210 254 / var(--tw-bg-opacity)); /* indigo-200 */
                    --rs-multiValue-bg: rgb(224 231 255 / var(--tw-bg-opacity)); /* indigo-100 */
                    --rs-multiValue-label-color: rgb(55 48 163 / var(--tw-text-opacity)); /* indigo-700 */
                    --rs-multiValue-remove-color: rgb(55 48 163 / var(--tw-text-opacity)); /* indigo-700 */
                    --rs-multiValue-remove-hover-bg: rgb(199 210 254 / var(--tw-bg-opacity)); /* indigo-200 */
                    --rs-multiValue-remove-hover-color: rgb(30 27 75 / var(--tw-text-opacity)); /* indigo-900 */
                    --rs-placeholder-color: rgb(107 114 128 / var(--tw-text-opacity)); /* gray-500 */
                    --rs-input-color: rgb(17 24 39 / var(--tw-text-opacity)); /* gray-900 */
                }
                .dark {
                    --rs-control-bg: rgb(55 65 81 / 0.6); /* gray-700/60 */
                    --rs-control-border: rgb(75 85 99 / var(--tw-border-opacity)); /* gray-600 */
                    --rs-control-border-focus: rgb(129 140 248 / var(--tw-border-opacity)); /* indigo-400 */
                    --rs-control-border-hover: rgb(107 114 128 / var(--tw-border-opacity)); /* gray-500 */
                    --rs-menu-bg: rgb(31 41 55 / var(--tw-bg-opacity)); /* gray-800 */
                    --rs-option-selected-bg: rgb(99 102 241 / var(--tw-bg-opacity)); /* indigo-500 */
                    --rs-option-focused-bg: rgb(55 65 81 / var(--tw-bg-opacity)); /* gray-700 */
                    --rs-option-bg: rgb(31 41 55 / var(--tw-bg-opacity)); /* gray-800 */
                    --rs-option-color: rgb(229 231 235 / var(--tw-text-opacity)); /* gray-200 */
                    --rs-option-active-bg: rgb(75 85 99 / var(--tw-bg-opacity)); /* gray-600 */
                    --rs-multiValue-bg: rgb(67 56 202 / var(--tw-bg-opacity)); /* indigo-600 */
                    --rs-multiValue-label-color: rgb(224 231 255 / var(--tw-text-opacity)); /* indigo-100 */
                    --rs-multiValue-remove-color: rgb(199 210 254 / var(--tw-text-opacity)); /* indigo-200 */
                    --rs-multiValue-remove-hover-bg: rgb(79 70 229 / var(--tw-bg-opacity)); /* indigo-600 */
                    --rs-multiValue-remove-hover-color: white;
                    --rs-placeholder-color: rgb(156 163 175 / var(--tw-text-opacity)); /* gray-400 */
                    --rs-input-color: rgb(243 244 246 / var(--tw-text-opacity)); /* gray-100 */
                }
            `}</style>

            <div className="py-12 font-sans">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8"> {/* Increased max-width */}

                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-700/30 border border-green-400 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-100 flex items-start shadow-md" role="alert">
                            <CheckCircle2 className="h-5 w-5 mr-3 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span>{flash.success}</span>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-700/30 border border-red-400 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-100 flex items-start shadow-md" role="alert">
                            <AlertTriangle className="h-5 w-5 mr-3 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <span>{flash.error || 'An unexpected error occurred.'}</span>
                        </div>
                    )}

                    {/* Header Section */}
                    <div className="mb-8 p-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                                    <ListChecks className="w-8 h-8 mr-3 text-indigo-600 dark:text-indigo-400" />
                                    {prospectList.name}
                                </h1>
                                {prospectList.description && (
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-xl flex items-start">
                                        <FileText size={16} className="mr-2 mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                        {prospectList.description}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-3 flex-shrink-0 mt-4 sm:mt-0">
                                <Link
                                    href={route('prospect-lists.edit', prospectList.id)}
                                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors"
                                >
                                    <Edit3 size={16} className="mr-2" /> Edit
                                </Link>
                                <Link
                                    href={route('prospect-lists.index')}
                                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors"
                                >
                                    Back to Lists
                                </Link>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <dl className="flex justify-between">
                                <div className="flex items-center">
                                    <Users size={18} className="mr-2 text-gray-500 dark:text-gray-400" />
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Contacts in list:</dt>
                                    <dd className="ml-1 text-sm text-gray-900 dark:text-gray-100 font-semibold">{prospectList.contacts_count}</dd>
                                </div>
                                <div className="flex items-center">
                                    <PlusCircle size={18} className="mr-2 text-gray-500 dark:text-gray-400" />
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Available to add:</dt>
                                    <dd className="ml-1 text-sm text-gray-900 dark:text-gray-100 font-semibold">{availableContacts.length}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>


                    {/* Add Contacts Section */}
                    <div className="mb-8 p-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl">
                        <h3 className="text-xl font-semibold mb-5 text-gray-800 dark:text-gray-100 border-b dark:border-gray-700 pb-3">Add Contacts to List</h3>
                        {availableContacts.length > 0 ? (
                            <form onSubmit={handleBulkAdd} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                                <div className="flex-grow min-w-0"> {/* Ensure Select can shrink */}
                                    <Select
                                        isMulti
                                        options={selectOptions}
                                        value={selectedContacts}
                                        onChange={setSelectedContacts}
                                        placeholder="Select contacts to add..."
                                        classNamePrefix="react-select"
                                        className="w-full text-sm"
                                        styles={reactSelectStyles}
                                        isDisabled={isAddingContacts}
                                        inputId="add-contacts-select"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!selectedContacts.length || isAddingContacts}
                                    className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                                >
                                    {isAddingContacts ? (
                                        <>
                                            <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Adding...
                                        </>
                                    ) : `Add ${selectedContacts.length || ''} Contact${selectedContacts.length !== 1 ? 's' : ''}`}
                                </button>
                            </form>
                        ) : (
                             <div className="p-4 text-center bg-gray-50 dark:bg-gray-700/30 rounded-md">
                                <Info size={20} className="mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    All workspace contacts are already in this list or no other contacts available.
                                </p>
                            </div>
                        )}
                    </div>


                    {/* Contacts in List Section */}
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                        <h3 className="text-xl font-semibold mb-5 text-gray-800 dark:text-gray-100 border-b dark:border-gray-700 pb-3">
                            Current Contacts ({contactsInList.total || 0})
                        </h3>
                        {contactsInList.data && contactsInList.data.length > 0 ? (
                            <div className="flow-root">
                                <ul role="list" className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
                                    {contactsInList.data.map(contact => (
                                        <li key={contact.id} className="py-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-shrink-0">
                                                    {/* Placeholder for avatar or icon */}
                                                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-800">
                                                        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-200">
                                                            {contact.name ? contact.name.charAt(0).toUpperCase() : '?'}
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{contact.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{contact.email}</p>
                                                </div>
                                                <div>
                                                    <button
                                                        onClick={() => handleRemoveContact(contact.id)}
                                                        disabled={removingContactId === contact.id}
                                                        className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {removingContactId === contact.id ? (
                                                            <>
                                                                <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Removing...
                                                            </>
                                                        ) : <><Trash2 size={12} className="mr-1.5" /> Remove</>}
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="p-4 text-center bg-gray-50 dark:bg-gray-700/30 rounded-md">
                                <Users size={20} className="mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    This prospect list is currently empty. Add some contacts above!
                                </p>
                            </div>
                        )}
                        {/* Pagination */}
                        <SimplePagination links={contactsInList.links} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
