import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import Logo, { LogoLS } from '@/Components/Logo';
import {
  Home,
  Users,
  Building,
  Settings,
  Shield,
  Key,
  User,
  UserCog,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  User2,
  BriefcaseBusiness,
  Users2,
  Mail,
  Phone,
  Globe,
  Contact2,
  X // Import the X icon
} from 'lucide-react';

const Sidebar = ({ user, sidebarOpen = false, setSidebarOpen }) => {
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('sidebar-collapsed');
            return stored === 'true';
        }
        return false;
    });

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen]);

    const isActive = (routeName) => route().current(routeName);
    const getUserInitials = (name) => {
        if (!name) return '?';
        const names = name.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    return <>
        {/* Mobile Sidebar Overlay */}
        <div
            className={`fixed inset-0 z-40 transition-opacity md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
            onClick={() => setSidebarOpen && setSidebarOpen(false)}
            aria-hidden={!sidebarOpen}
        />
        {/* Sidebar */}
        <aside
            className={`
                fixed z-50 inset-y-0 left-0
                bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full
                transition-transform duration-200
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:static md:flex md:flex-shrink-0
                w-64 ${collapsed && !sidebarOpen ? 'md:w-20' : 'md:w-64'}
            `}
            // Removed boxShadow style to rely on the dedicated overlay
        >
            <div className="flex flex-col h-full w-full">
                <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full">
                    {/* Toggle Button */}
                    <div className={`flex items-center px-4 mb-5 ${(collapsed && !sidebarOpen) ? 'justify-center' : 'justify-between'}`}>
                        <Link href={route('dashboard')}>
                            {/* Show full logo if mobile sidebar is open or if desktop is not collapsed */}
                            {(sidebarOpen || !collapsed) ? <Logo /> : <LogoLS className="w-8 h-8" />}
                        </Link>
                        {/* Mobile Close Button - visible only when sidebarOpen is true and on mobile screens */}
                        {sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen && setSidebarOpen(false)}
                                className="md:hidden ml-2 p-1 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                aria-label="Close sidebar"
                            >
                                <X size={24} />
                            </button>
                        )}
                        <button
                            onClick={() => setCollapsed((c) => {
                                localStorage.setItem('sidebar-collapsed', !c);
                                return !c;
                            })}
                            // Hide collapse toggle button on mobile, show on md+
                            className="hidden md:inline-flex ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>
                    </div>
                    <div className="flex-grow mt-5 flex flex-col">
                        <nav className="flex-1 px-2 pb-4 space-y-1">
                            {/* Main Section */}
                            {(sidebarOpen || !collapsed) && <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-2 mt-2 mb-1">Main</div>}
                            <Link
                                href={route('dashboard')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('dashboard')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Home className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('dashboard') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {(sidebarOpen || !collapsed) && 'Dashboard'}
                            </Link>
                            <Link
                                href={route('leads.index')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('leads.index')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <User2 className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('leads.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {(sidebarOpen || !collapsed) && 'Leads'}
                            </Link>
                            <Link
                                href={route('contacts.index')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('contacts.index')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Contact2 className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('contacts.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {(sidebarOpen || !collapsed) && 'Contacts'}
                            </Link>
                            <Link
                                href={route('workspaces.index')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('workspaces.index')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Globe className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('workspaces.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {(sidebarOpen || !collapsed) && 'Workspaces'}
                            </Link>
                            <Link
                                href={route('companies.index')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('companies.index')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <BriefcaseBusiness className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('companies.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {(sidebarOpen || !collapsed) && 'Companies'}
                            </Link>

                            {/* Access Control Section */}
                            {(sidebarOpen || !collapsed) && <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-2 mt-5 mb-1">Access Control</div>}
                            <Link
                                href={route('users.index')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('users.index')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Users2 className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('users.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {(sidebarOpen || !collapsed) && 'Users'}
                            </Link>
                            <Link
                                href={route('roles.index')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('roles.index')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Shield className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('roles.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {(sidebarOpen || !collapsed) && 'Roles'}
                            </Link>
                            <Link
                                href={route('permissions.index')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('permissions.index')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Key className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('permissions.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {(sidebarOpen || !collapsed) && 'Permissions'}
                            </Link>

                            {/* Logs Section */}
                            {(sidebarOpen || !collapsed) && <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-2 mt-5 mb-1">Logs</div>}
                            <Link
                                href={route('activity.logs')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('activity.logs')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <ScrollText className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('activity.logs') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {(sidebarOpen || !collapsed) && 'Activity Logs'}
                            </Link>
                        </nav>
                    </div>
                    {/* User info at bottom of sidebar */}
                    <div className={`flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/70 ${(collapsed && !sidebarOpen) ? 'justify-center' : ''}`}>
                        <div className={`flex items-center w-full gap-3 ${(collapsed && !sidebarOpen) ? 'justify-center' : ''}`}>
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-400 dark:border-blue-600 shadow"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold border-2 border-blue-400 dark:border-blue-600 shadow">
                                    {getUserInitials(user?.name)}
                                </div>
                            )}
                            {(sidebarOpen || !collapsed) && (
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="truncate text-sm font-semibold text-gray-800 dark:text-white">{user?.name ?? 'User'}</span>
                                    <Link href={route('profile')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-0.5">View profile</Link>
                                </div>
                            )}
                            {(sidebarOpen || !collapsed) && (
                                <form method="POST" action={route('logout')} onSubmit={e => {
                                    e.preventDefault();
                                    if (window.Inertia && window.Inertia.post) {
                                        window.Inertia.post(route('logout'), {}, {
                                            headers: {
                                                'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]')?.content || ''
                                            }
                                        });
                                    } else {
                                        // fallback: create a form and submit it
                                        const form = document.createElement('form');
                                        form.method = 'POST';
                                        form.action = route('logout');
                                        const csrf = document.createElement('input');
                                        csrf.type = 'hidden';
                                        csrf.name = '_token';
                                        csrf.value = document.querySelector('meta[name=csrf-token]')?.content || '';
                                        form.appendChild(csrf);
                                        document.body.appendChild(form);
                                        form.submit();
                                    }
                                }}>
                                    <input type="hidden" name="_token" value={document.querySelector('meta[name=csrf-token]')?.content || ''} />
                                    <button
                                        type="submit"
                                        className="ml-2 px-3 py-1 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                                    >
                                        Logout
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    </>;
}

export default Sidebar;
