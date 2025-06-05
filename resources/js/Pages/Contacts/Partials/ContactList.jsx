import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronUp, ChevronDown, Edit3, Trash2, Mail, Phone, Building } from 'lucide-react';

const SortableHeader = ({ children, columnKey, currentSortBy, currentSortDirection, onSort }) => {
    const isActive = currentSortBy === columnKey;
    const icon = isActive ? (currentSortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronDown size={14} className="text-transparent group-hover:text-gray-400" />;

    return (
        <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 group"
            onClick={() => onSort(columnKey)}
        >
            <div className="flex items-center">
                {children}
                <span className="ml-1.5">{icon}</span>
            </div>
        </th>
    );
};

const ContactList = ({ displayedContacts, getAvatarPlaceholder, handleDelete, sortBy, sortDirection, onSort, isListMounted }) => {
    if (!isListMounted) {
        return (
            <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-3 text-gray-600 dark:text-gray-400">Loading contacts...</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow-xl overflow-hidden rounded-xl">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <SortableHeader columnKey="name" currentSortBy={sortBy} currentSortDirection={sortDirection} onSort={onSort}>
                                Name
                            </SortableHeader>
                            <SortableHeader columnKey="email" currentSortBy={sortBy} currentSortDirection={sortDirection} onSort={onSort}>
                                Email
                            </SortableHeader>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Phone
                            </th>
                            <SortableHeader columnKey="company_name" currentSortBy={sortBy} currentSortDirection={sortDirection} onSort={onSort}>
                                Company
                            </SortableHeader>
                            <SortableHeader columnKey="created_at" currentSortBy={sortBy} currentSortDirection={sortDirection} onSort={onSort}>
                                Created
                            </SortableHeader>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {displayedContacts.length > 0 ? (
                            displayedContacts.map(contact => (
                                <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150 group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                
                                                {contact.avatar_url ? (
                                                    <img className="h-10 w-10 rounded-full object-cover" src={contact.avatar_url} alt={contact.name} />
                                                ) : (
                                                    (() => {
                                                        const placeholder = getAvatarPlaceholder(contact.name);
                                                        return (
                                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${placeholder.colorClass || 'bg-gray-400 dark:bg-gray-600'}`}>
                                                                {placeholder.initials}
                                                            </div>
                                                        );
                                                    })()
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <Link href={route('contacts.show', contact.id)} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400">
                                                    {contact.name}
                                                </Link>
                                                {contact.title && <div className="text-xs text-gray-500 dark:text-gray-400">{contact.title}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{contact.email || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{contact.phone || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{contact.company?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                        {new Date(contact.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                        {/* Prospect Lists Display */}
                                        {Array.isArray(contact.prospectLists) && contact.prospectLists.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {contact.prospectLists.map(list => (
                                                    <span key={list.id} className="inline-block bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-indigo-100 text-xs font-medium px-2 py-0.5 rounded mr-1 mb-1">
                                                        {list.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-600">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <div className="flex items-center justify-end space-x-2"> {/* Removed opacity classes */}
                                            <Link href={route('contacts.edit', contact.id)} className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-gray-700" title="Edit">
                                                <Edit3 size={16} />
                                            </Link>
                                            <button onClick={() => handleDelete(contact.id, contact.name)} className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-gray-700" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        {/* Removed the "Hover" span */}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center">
                                    <div className="text-gray-500 dark:text-gray-400">
                                        <Mail size={32} className="mx-auto mb-3 opacity-50" />
                                        <p className="text-lg font-medium">No contacts found.</p>
                                        <p className="text-sm">Try adjusting your search or add new contacts.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ContactList;