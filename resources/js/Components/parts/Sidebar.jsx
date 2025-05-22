import React from 'react';
import { Link } from '@inertiajs/react';
import Logo from '@/Components/Logo'; // Adjust path if needed
const Sidebar = ({ user}) => {

    const isActive = (routeName) => route().current(routeName);

    const getUserInitials = (name) => {
        if (!name) return '?';
        const names = name.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };


    // Simple SVG Icons (Replace with a library like lucide-react if preferred)
    const HomeIcon = ({ className = "w-6 h-6" }) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
    );

    const UsersIcon = ({ className = "w-6 h-6" }) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
    );

    const SettingsIcon = ({ className = "w-6 h-6" }) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995a6.903 6.903 0 0 1 0 1.989c0 .382.145.755.438.995l1.003.827c.481.398.688.997.26 1.431l-1.296 2.247a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.437-.995a6.903 6.903 0 0 1 0-1.989c0-.382-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 0 1-.26-1.431l1.296-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
    );
    return <>
        {/* Sidebar */}
        {/* Fixed sidebar for medium screens and up, hidden on small screens initially */}
        <aside className="hidden md:flex md:flex-shrink-0">
            <div className="flex flex-col w-64">
                {/* Sidebar component, swap this element with another sidebar if you like */}
                <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                    {/* Logo in Sidebar */}
                    <div className="flex items-center flex-shrink-0 px-4 mb-5">
                        <Link href={route('dashboard')}>
                            <Logo />
                        </Link>
                    </div>
                    <div className="flex-grow mt-5 flex flex-col">
                        <nav className="flex-1 px-2 pb-4 space-y-1">
                            {/* Menu Items */}
                            <Link
                                href={route('dashboard')}
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('dashboard')
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <HomeIcon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('dashboard') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                Dashboard
                            </Link>

                            {/* Placeholder: Leads Link */}
                            <Link
                                href={route('leads.index')} // Replace with actual route like route('leads.index')
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('leads.index') // Adjust route name check
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <UsersIcon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('leads.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                Leads
                            </Link>

                            {/* Placeholder: Settings Link */}
                            <Link
                                href="#" // Replace with actual route like route('settings.index')
                                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${isActive('settings.index') // Adjust route name check
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <SettingsIcon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive('settings.index') ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                Settings
                            </Link>
                        </nav>
                    </div>
                    {/* Optional: User info at bottom of sidebar */}
                    <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
                        <a href="#" className="flex-shrink-0 w-full group block"> {/* Link to profile page? */}
                            <div className="flex items-center">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                                    {getUserInitials(user?.name)}
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700 dark:text-white group-hover:text-gray-900 dark:group-hover:text-gray-200">
                                        {user?.name ?? 'User'}
                                    </p>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                                        View profile {/* Or user role */}
                                    </p>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </aside>

    </>
}

export default Sidebar;