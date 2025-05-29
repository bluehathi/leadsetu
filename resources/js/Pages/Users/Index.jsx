import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router as InertiaRouter } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Edit2 as EditIcon, Trash2, CheckCircle2, XCircle, User as UserPlaceholderIcon, Mail, Briefcase, Shield, Users as UsersGroupIcon } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

// Helper function to generate a placeholder avatar style
const getUserAvatarPlaceholder = (name) => {
    const colors = [
        'bg-red-400', 'bg-green-400', 'bg-blue-400', 'bg-yellow-400', 
        'bg-purple-400', 'bg-indigo-400', 'bg-pink-400', 'bg-teal-400',
        'bg-cyan-400', 'bg-orange-400', 'bg-lime-400', 'bg-emerald-400'
    ];
    if (!name || name.trim() === '') name = "U"; 
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];
    
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return {
        colorClass: `${color} text-white`,
        initials: initials || name.charAt(0).toUpperCase()
    };
};


export default function UsersIndex({ users: initialUsers = [] }) { 
    const { props } = usePage();
    const authUser = props.auth?.user; 
    const flash = props.flash || {};
    const [isListMounted, setIsListMounted] = useState(false);
    const [search, setSearch] = useState(props.search || '');

    const users = Array.isArray(initialUsers) ? initialUsers : [];

    useEffect(() => {
        const timer = setTimeout(() => setIsListMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);
    
    const handleDelete = (userId, userName) => {
        if (confirm(`Are you sure you want to delete the user "${userName}"? This action cannot be undone.`)) {
            InertiaRouter.delete(route('users.destroy', userId), {
                preserveScroll: true,
            });
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        // Optionally, debounce this for better UX
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        InertiaRouter.get(route('users.index'), { search }, { preserveState: true, replace: true });
    };

    return (
        <AuthenticatedLayout user={authUser} title="Manage Users">
            <Head title="Users" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 w-full mx-auto"> {/* Adjusted max-width for list view */}
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <form onSubmit={handleSearchSubmit} className="flex w-full sm:w-auto items-center gap-2 flex-1">
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Search users..."
                            className="w-full sm:w-64 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        />
                        <button
                            type="submit"
                            className="hidden"
                            aria-label="Search"
                        >Search</button>
                    </form>
                    <Link
                        href={route('users.create')}
                        className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm font-medium self-end sm:self-center"
                    >
                        <Plus size={18} className="mr-2 -ml-1" />
                        Add User
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

                {users.length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl">
                        <div className="space-y-0"> {/* Container for list items */}
                            {users.map((userItem, index) => { 
                                const avatar = getUserAvatarPlaceholder(userItem.name);
                                return (
                                    <div 
                                        key={userItem.id}
                                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 transition-all duration-300 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-700/50
                                                    ${index !== 0 ? 'border-t border-gray-200 dark:border-gray-700/60' : ''}
                                                    ${isListMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
                                        style={{ animationDelay: isListMounted ? `${index * 0.07}s` : '0s' }}
                                    >
                                        <div className="flex items-center flex-1 min-w-0 mb-3 sm:mb-0">
                                            <div className={`w-12 h-12 ${avatar.colorClass} rounded-full flex items-center justify-center font-semibold text-lg mr-4 flex-shrink-0 shadow-md`}>
                                                {avatar.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 truncate" title={userItem.name}>
                                                    {userItem.name}
                                                </h3>
                                                {userItem.email && (
                                                    <a href={`mailto:${userItem.email}`} className="text-xs text-blue-500 dark:text-blue-400 hover:underline truncate flex items-center mt-0.5" title={userItem.email} onClick={(e) => e.stopPropagation()}>
                                                        <Mail size={12} className="mr-1.5 flex-shrink-0" /> {userItem.email}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="w-full sm:w-auto sm:max-w-xs md:max-w-sm mb-3 sm:mb-0 sm:mx-4 flex-shrink-0">
                                            {userItem.workspace?.name && (
                                                <p className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1" title={`Workspace: ${userItem.workspace.name}`}>
                                                    <Briefcase size={14} className="mr-1.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                    {userItem.workspace.name}
                                                </p>
                                            )}
                                            {userItem.roles && userItem.roles.length > 0 && (
                                                <div className="flex items-start">
                                                    <Shield size={14} className="mr-1.5 mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                    <div className="flex flex-wrap gap-1">
                                                        {userItem.roles.map(r => (
                                                            <span key={r.id} className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-200 rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                                                                {r.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-shrink-0 flex items-center space-x-2 self-start sm:self-center w-full sm:w-auto justify-end sm:justify-center">
                                            <Tippy content="Edit User">
                                                <Link href={route('users.edit', userItem.id)} className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-300 transition-colors p-1.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-700/50">
                                                    <EditIcon size={18} />
                                                </Link>
                                            </Tippy>
                                            {authUser && authUser.id !== userItem.id && (
                                                <Tippy content="Delete User">
                                                    <button onClick={() => handleDelete(userItem.id, userItem.name)} className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-300 transition-colors p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-700/50">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </Tippy>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                     <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl">
                        <UsersGroupIcon size={56} className="mx-auto mb-5 text-gray-400 dark:text-gray-500" />
                        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">No Users Found</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Get started by adding a new user.
                        </p>
                        <Link
                            href={route('users.create')}
                            className="mt-6 inline-flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                        >
                            <Plus size={16} className="mr-2" /> Add New User
                        </Link>
                    </div>
                )}
                {/* Pagination would go here if users prop is a paginator object */}
                {/* Example: {users.links && <Pagination links={users.links} />} */}
            </div>
        </AuthenticatedLayout>
    );
}
