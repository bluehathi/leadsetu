import React from 'react';
import { Edit2, Trash2, Mail, Phone, Building, Filter, Briefcase, Send } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function ContactListCard({ contact, avatar, handleDelete }) {
    return (
        <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between transition-all duration-300 ease-in-out hover:shadow-2xl hover:ring-2 hover:ring-blue-500 dark:hover:ring-blue-400`}>
            <div className="flex items-start sm:items-center flex-1 min-w-0 mb-3 sm:mb-0">
                <div className={`w-10 h-10 ${avatar.colorClass} rounded-full flex items-center justify-center text-white font-semibold text-lg mr-4 flex-shrink-0 shadow`}>
                    {avatar.initials}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 truncate" title={contact.name}>
                        {contact.name}
                    </h3>
                    {contact.title && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={contact.title}>
                            <Briefcase size={12} className="inline mr-1 opacity-70" /> {contact.title}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex-1 min-w-0 text-xs text-gray-600 dark:text-gray-300 space-y-1 sm:mx-4 mb-3 sm:mb-0 w-full sm:w-auto">
                {contact.email && (
                    <a href={`mailto:${contact.email}`} className="hover:underline truncate flex items-center" title={contact.email} onClick={e => e.stopPropagation()}>
                        <Mail size={12} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" /> {contact.email}
                    </a>
                )}
                {contact.phone && (
                    <p className="flex items-center truncate" title={contact.phone}>
                        <Phone size={12} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        {contact.phone}
                    </p>
                )}
            </div>
            <div className="flex-1 min-w-0 text-xs text-gray-600 dark:text-gray-300 mb-3 sm:mb-0 w-full sm:w-auto">
                {contact.company && contact.company.name && (
                    <>
                        <p className="flex items-center truncate" title={contact.company.name}>
                            <Building size={12} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            {contact.company.name}

                        </p>
                        {contact.company.website && (
                            <a
                                href={contact.company.website.startsWith('http') ? contact.company.website : `https://${contact.company.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className=" text-blue-500 dark:text-blue-400 hover:underline flex items-center"
                                title={contact.company.website}
                            >
                                <Filter size={12} className="mr-2" />
                                <span className="truncate w-auto align-middle">{contact.company.website}</span>
                            </a>
                        )}
                    </>

                )}
                
            </div>
            <div className="flex items-center justify-end space-x-2.5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200 dark:border-gray-700/50">
                <Link
                    href="#" // Adjust route as needed
                    className="text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-300 transition-colors p-1.5 rounded-md hover:bg-green-100 dark:hover:bg-green-700/50"
                    title="Send Email"
                    as="button"
                    method="post"
                    preserveScroll
                >
                    <Send size={18} />
                </Link>
                <Link href={route('contacts.edit', contact.id)} className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-300 transition-colors p-1.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-700/50" title="Edit Contact">
                    <Edit2 size={18} />
                </Link>
                <button onClick={() => handleDelete(contact.id, contact.name)} className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-300 transition-colors p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-700/50" title="Delete Contact">
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
