import React from 'react';
import { Edit2, Trash2, Mail, Phone, Building, Filter, Send } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function ContactGridCard({ contact, avatar, handleDelete }) {
    return (
        <div 
            className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl p-5 flex flex-col justify-between transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1`}
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
                            <a href={`mailto:${contact.email}`} className="text-xs text-blue-500 dark:text-blue-400 hover:underline truncate flex items-center mt-1" title={contact.email} onClick={e => e.stopPropagation()}>
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
                            {contact.company.website && (
                                <a
                                    href={contact.company.website.startsWith('http') ? contact.company.website : `https://${contact.company.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-blue-500 dark:text-blue-400 hover:underline flex items-center"
                                    title={contact.company.website}
                                >
                                    <Filter size={12} className="mr-1" />
                                    <span className="truncate max-w-[100px] xl:max-w-[120px] align-middle">{contact.company.website}</span>
                                </a>
                            )}
                        </p>
                    )}
                </div>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-2.5">
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
