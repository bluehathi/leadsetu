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
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ user }) => {
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('sidebar-collapsed');
            return stored === 'true';
        }
        return false;
    });

    const isActive = (routeName) => route().current(routeName);
    const getUserInitials = (name) => {
        if (!name) return '?';
        const names = name.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };
    return <>
        {/* Sidebar */}
        <aside className={`hidden md:flex md:flex-shrink-0 transition-all duration-200 ${collapsed ? 'w-20' : 'w-64'}`}>
            <div className="flex flex-col h-full w-full">
                <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full">
                    {/* Toggle Button */}
                    <div className={`flex items-center px-4 mb-5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
                        <Link href={route('dashboard')}>
                            {collapsed ? <LogoLS className="w-8 h-8" /> : <Logo />}
                        </Link>
                        <button
                            onClick={() => setCollapsed((c) => {
                                localStorage.setItem('sidebar-collapsed', !c);
                                return !c;
                            })}
                            className="ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>
                    </div>
                    <div className="flex-grow mt-5 flex flex-col">
                        <nav className="flex-1 px-2 pb-4 space-y-1">
                            {/* Main Section */}
                            {!collapsed && <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-2 mt-2 mb-1">Main</div>}
                            <Link
                                href={route('dashboard')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('dashboard')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Home className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('dashboard') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {!collapsed && 'Dashboard'}
                            </Link>
                            <Link
                                href={route('leads.index')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('leads.index')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Users className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('leads.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {!collapsed && 'Leads'}
                            </Link>
                            <Link
                                href={route('contacts.index')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('contacts.index')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Users className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('contacts.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {!collapsed && 'Contacts'}
                            </Link>
                            <Link
                                href={route('workspaces.index')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('workspaces.index')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Building className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('workspaces.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {!collapsed && 'Workspaces'}
                            </Link>
                            <Link
                                href={route('companies.index')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('companies.index')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Building className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('companies.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {!collapsed && 'Companies'}
                            </Link>

                            {/* Access Control Section */}
                            {!collapsed && <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-2 mt-5 mb-1">Access Control</div>}
                            <Link
                                href={route('users.index')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('users.index')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <User className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('users.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {!collapsed && 'Users'}
                            </Link>
                            <Link
                                href={route('roles.index')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('roles.index')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Shield className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('roles.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {!collapsed && 'Roles'}
                            </Link>
                            <Link
                                href={route('permissions.index')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('permissions.index')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Key className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('permissions.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {!collapsed && 'Permissions'}
                            </Link>

                            {/* Settings Section */}
                            {!collapsed && <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-2 mt-5 mb-1">Settings</div>}
                            <Link
                                href={route('workspace.settings')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('workspace.settings')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Building className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('workspace.settings') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {!collapsed && 'Workspace Settings'}
                            </Link>
                            <Link
                                href={route('profile')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('profile')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <UserCog className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('profile') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {!collapsed && 'My Profile'}
                            </Link>
                            {/* <Link
                                href="#"
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('settings.index')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Settings className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('settings.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {!collapsed && 'Settings'}
                            </Link> */}

                            {/* Logs Section */}
                            {!collapsed && <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 px-2 mt-5 mb-1">Logs</div>}
                            <Link
                                href={route('activity.logs')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('activity.logs')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <ScrollText className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('activity.logs') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                {!collapsed && 'Activity Logs'}
                            </Link>
                        </nav>
                    </div>
                    {/* User info at bottom of sidebar */}
                    <div className={`flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/70 ${collapsed ? 'justify-center' : ''}`}>
                        <div className={`flex items-center w-full gap-3 ${collapsed ? 'justify-center' : ''}`}>
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
                            {!collapsed && (
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="truncate text-sm font-semibold text-gray-800 dark:text-white">{user?.name ?? 'User'}</span>
                                    <Link href={route('profile')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-0.5">View profile</Link>
                                </div>
                            )}
                            {!collapsed && (
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
    </>
}

export default Sidebar;