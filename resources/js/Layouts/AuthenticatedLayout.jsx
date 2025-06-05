import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '@/Components/LayoutParts/Sidebar'; // Assuming this path is correct
import { Head, Link, router } from '@inertiajs/react';
import { User2, LogOut, Building2, Menu } from 'lucide-react';
import { LogoLS } from '@/Components/Logo'; // Ensure LogoLS is imported

export default function AuthenticatedLayout({ user, title, children }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const dropdownRef = useRef(null);
    const avatarBtnRef = useRef(null);

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

    const getInitials = (name) => {
        if (!name) return '';
        const parts = name.split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return parts.map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const handleLogout = (e) => {
        e.preventDefault();
        router.post(route('logout'));
    };

    return (
        <>
            {title && <Head title={title} />}
            <div className="flex h-screen bg-gray-100 dark:bg-gray-950 font-sans"> {/* Slightly darker bg for dark mode */}
                <Sidebar user={user} sidebarOpen={mobileSidebarOpen} setSidebarOpen={setMobileSidebarOpen} />
                
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    {/* Unified Responsive Header */}
                    <header className="flex w-full bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700/60 items-center justify-between px-3 md:px-6 h-16 z-20 relative shrink-0">
                        {/* Left Side: Hamburger (Mobile) + Logo (Mobile) + Title (All Screens) */}
                        <div className="flex items-center flex-1 min-w-0">
                            <button
                                type="button"
                                className="p-2 mr-1 text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-150 md:hidden"
                                onClick={() => setMobileSidebarOpen(true)}
                            >
                                <span className="sr-only">Open sidebar</span>
                                <Menu size={24} />
                            </button>
                            
                            <div className="md:hidden">
                                <Link href={route('dashboard')} className="flex items-center">
                                    <LogoLS className="h-7 w-auto mr-2" />
                                </Link>
                            </div>
                            
                            <div className="text-base md:text-xl font-semibold text-gray-700 dark:text-gray-200 truncate">
                                {title || 'Dashboard'}
                            </div>
                        </div>

                        {/* Right Side: User Avatar and Dropdown */}
                        <div className="flex items-center gap-2 md:gap-3 relative shrink-0"> {/* Reduced gap slightly */}
                            <button
                                ref={avatarBtnRef}
                                className="flex items-center gap-2.5 p-1 rounded-full focus:outline-none group transition-transform duration-150 hover:scale-105"
                                onClick={() => setDropdownOpen((v) => !v)}
                                aria-haspopup="true"
                                aria-expanded={dropdownOpen}
                                type="button"
                            >
                                <span className="inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-blue-100 dark:bg-blue-800/70 text-blue-600 dark:text-blue-200 font-bold text-xs md:text-sm group-hover:ring-2 group-hover:ring-blue-400 dark:group-hover:ring-blue-600 group-hover:ring-offset-1 dark:group-hover:ring-offset-white dark:group-hover:ring-offset-gray-900 transition-all duration-150">
                                    {user?.name ? getInitials(user.name) : <User2 size={18} />}
                                </span>
                                <span className="hidden sm:block text-gray-700 dark:text-gray-300 font-medium text-sm md:text-base group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-150">
                                    {user?.name}
                                </span>
                            </button>
                            {/* Dropdown */}
                            {/* Added transition classes for appear animation */}
                            <div
                                ref={dropdownRef}
                                className={`absolute right-0 top-full mt-2.5 w-[calc(100vw-2rem)] max-w-xs sm:w-full sm:min-w-[250px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 flex flex-col items-stretch overflow-hidden
                                            transition-all duration-200 ease-out origin-top-right
                                            ${dropdownOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
                                // Using Tailwind shadow, custom shadow can also be kept if preferred: style={{ boxShadow: '0 10px 35px -5px rgba(0,0,0,0.1), 0 8px 15px -8px rgba(0,0,0,0.07)' }}
                            >
                                <div className="px-4 pt-4 pb-3 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-700/70">
                                    <span className="block text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider text-center truncate" title={user?.workspace?.name}>
                                        {user?.workspace && user.workspace.name ? user.workspace.name : 'Workspace'}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center gap-1.5 px-4 pt-5 pb-4">
                                    <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-600/30 text-blue-600 dark:text-blue-200 font-bold text-2xl mb-1 ring-4 ring-blue-500/10">
                                        {user?.name ? getInitials(user.name) : <User2 size={30} />}
                                    </span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-100 text-lg leading-tight text-center break-words w-full">{user?.name}</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 text-center break-all w-full">{user?.email}</span>
                                </div>
                                <div className="flex flex-col gap-0.5 px-2.5 py-2.5 border-t border-gray-100 dark:border-gray-700/50">
                                    <Link
                                        href={route('profile')}
                                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors duration-150 font-medium rounded-lg"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <User2 size={16} /> Profile
                                    </Link>
                                    <Link
                                        href={route('workspace.settings')}
                                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors duration-150 font-medium rounded-lg"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <Building2 size={16} /> Workspace Settings
                                    </Link>
                                    <button
                                        onClick={(e) => { handleLogout(e); setDropdownOpen(false); }}
                                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors duration-150 font-medium rounded-lg"
                                    >
                                        <LogOut size={16} /> Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50 dark:bg-gray-900"> {/* Added bg color to main */}
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}