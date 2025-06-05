import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Trash2, Mail, Phone, Building, Globe, MoreVertical, ListPlus } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function ContactGridCard({ contact, avatar, handleDelete, onAddToPlaylistClick }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div 
            className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl p-5 flex flex-col justify-between transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1 border border-gray-200 dark:border-gray-700/60`}
        >
            <div>
                <div className="flex items-start mb-4">
                    {contact.avatar_url ? (
                        <img className="w-14 h-14 rounded-full object-cover mr-4 flex-shrink-0 shadow-md" src={contact.avatar_url} alt={contact.name} />
                    ) : (
                        <div className={`w-14 h-14 ${avatar.colorClass || 'bg-gradient-to-br from-blue-500 to-indigo-600'} rounded-full flex items-center justify-center text-white font-semibold text-xl mr-4 flex-shrink-0 shadow-md`}>
                            {avatar.initials}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <Link 
                            href={route('contacts.show', contact.id)} 
                            className="block group"
                            onClick={e => e.stopPropagation()} // Prevent card click if card itself becomes clickable
                        >
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={contact.name}>
                                {contact.name}
                            </h3>
                        </Link>
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
                                    onClick={e => e.stopPropagation()}
                                >
                                    <Globe size={12} className="mr-1" />
                                    <span className="truncate max-w-[100px] xl:max-w-[120px] align-middle">{contact.company.website}</span>
                                </a>
                            )}
                        </p>
                    )}
                </div>
                {/* Prospect Lists Display */}
                {Array.isArray(contact.prospectLists) && contact.prospectLists.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {contact.prospectLists.map(list => (
                            <span key={list.id} className="inline-block bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-indigo-100 text-xs font-medium px-2 py-0.5 rounded mr-1 mb-1">
                                {list.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-1">
                 <Link href={route('contacts.edit', contact.id)} onClick={e => e.stopPropagation()} className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-300 transition-colors p-2 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-700/50" title="Edit Contact">
                    <Edit2 size={18} />
                </Link>
                <button onClick={(e) => {e.stopPropagation(); handleDelete(contact.id, contact.name);}} className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-300 transition-colors p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-700/50" title="Delete Contact">
                    <Trash2 size={18} />
                </button>
                 <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDropdownOpen(prev => !prev);
                        }}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        title="More options"
                    >
                        <MoreVertical size={18} />
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (typeof onAddToPlaylistClick === 'function') {
                                        onAddToPlaylistClick(contact.id);
                                    }
                                    setIsDropdownOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                            >
                                <ListPlus size={16} className="mr-2" /> Add to Playlist
                            </button>
                        </div>
                    )}
                </div>
               
            </div>
        </div>
    );
}
