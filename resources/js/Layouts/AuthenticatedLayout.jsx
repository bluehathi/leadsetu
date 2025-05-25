import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '@/Components/parts/Sidebar';
import { Head, Link, router } from '@inertiajs/react';
import { User2, LogOut, Building2 } from 'lucide-react';

export default function AuthenticatedLayout({ user, title, children }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const avatarBtnRef = useRef(null);

    // Improved click-outside logic
    useEffect(() => {
        function handleClick(event) {
            if (
                dropdownOpen &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                avatarBtnRef.current &&
                !avatarBtnRef.current.contains(event.target)
            ) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [dropdownOpen]);

    // Get user initials for avatar
    const getInitials = (name) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const handleLogout = (e) => {
        e.preventDefault();
        router.post(route('logout'));
    };

    return (
        <>
            {title && <Head title={title} />}
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
                <Sidebar user={user} />
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    {/* Header */}
                    <header className="w-full bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 h-16 z-20 relative">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">LeadSetu</div>
                        <div className="flex items-center gap-4 relative">
                            <button
                                ref={avatarBtnRef}
                                className="flex items-center gap-2 focus:outline-none group"
                                onClick={() => setDropdownOpen((v) => !v)}
                                aria-haspopup="true"
                                aria-expanded={dropdownOpen}
                                type="button"
                            >
                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold text-lg">
                                    {user?.name ? getInitials(user.name) : <User2 size={22} />}
                                </span>
                                <span className="hidden sm:block text-gray-700 dark:text-gray-200 font-medium text-base">{user?.name}</span>
                            </button>
                            {/* Dropdown */}
                            {dropdownOpen && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute sm:right-4 right-2 sm:left-auto left-2 sm:mx-0 mx-2 top-full mt-3 w-full max-w-xs min-w-[200px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col items-stretch overflow-hidden"
                                    style={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)' }}
                                >
                                    {/* Workspace name at top */}
                                    <div className="px-6 pt-4 pb-2 bg-blue-50/80 dark:bg-blue-900/40 border-b border-blue-100 dark:border-blue-800">
                                        <span className="block text-xs font-semibold text-blue-700 dark:text-blue-200 uppercase tracking-wider text-center truncate" title={user?.workspace?.name}>{user?.workspace && user.workspace.name ? user.workspace.name : 'Workspace'}</span>
                                    </div>
                                    {/* User info */}
                                    <div className="flex flex-col items-center gap-2 px-6 pt-6 pb-4 bg-gradient-to-b from-blue-50/60 dark:from-blue-900/30 to-transparent">
                                        <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200 font-bold text-2xl mb-1">
                                            {user?.name ? getInitials(user.name) : <User2 size={32} />}
                                        </span>
                                        <span className="font-semibold text-gray-900 dark:text-white text-base leading-tight text-center break-words w-full">{user?.name}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 text-center break-all w-full">{user?.email}</span>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex flex-col gap-1 px-2 py-2 bg-white dark:bg-gray-900">
                                        <Link
                                            href={route('profile')}
                                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition font-medium rounded-xl"
                                        >
                                            <User2 size={16} /> Profile
                                        </Link>
                                        <Link
                                            href={route('workspace.settings')}
                                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition font-medium rounded-xl"
                                        >
                                            <Building2 size={16} /> Workspace Settings
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition font-medium rounded-xl"
                                        >
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </header>
                    <main className="flex-1 relative overflow-y-auto focus:outline-none">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}
