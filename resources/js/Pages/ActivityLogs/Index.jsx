import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import Select from 'react-select';
import { 
    CheckCircle2, XCircle, Search, Filter as FilterIcon, RotateCcw, CalendarDays, User as UserIcon, 
    Settings2, Info, FileText, AlertTriangle, Edit2, PlusCircle, Trash2, ArrowRightLeft,RefreshCw,StickyNote,
    LogIn, LogOut as LogOutIcon, ShieldCheck, KeyRound, Briefcase, Users as UsersIcon, ScrollText, SlidersHorizontal
} from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

// Action meta for icons and colors (can be expanded)
const actionDisplayMeta = {
    // Lead Actions
    lead_created: { icon: <PlusCircle size={18} />, color: 'text-green-500 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-700/30', label: 'Lead Created' },
    lead_updated: { icon: <Edit2 size={18} />, color: 'text-blue-500 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-700/30', label: 'Lead Updated' },
    lead_deleted: { icon: <Trash2 size={18} />, color: 'text-red-500 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-700/30', label: 'Lead Deleted' },
    status_changed: { icon: <RefreshCw size={18} />, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-700/30', label: 'Status Changed' },
    note_added: { icon: <StickyNote size={18} />, color: 'text-purple-500 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-700/30', label: 'Note Added' },
    // User/Auth Actions
    user_created: { icon: <UserIcon size={18} />, color: 'text-green-500 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-700/30', label: 'User Created' },
    user_updated: { icon: <UserIcon size={18} />, color: 'text-blue-500 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-700/30', label: 'User Updated' },
    user_deleted: { icon: <UserIcon size={18} />, color: 'text-red-500 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-700/30', label: 'User Deleted' },
    logged_in: { icon: <LogIn size={18} />, color: 'text-sky-500 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-700/30', label: 'Logged In' },
    logged_out: { icon: <LogOutIcon size={18} />, color: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-700/30', label: 'Logged Out' },
    // Role/Permission Actions
    role_created: { icon: <ShieldCheck size={18} />, color: 'text-green-500 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-700/30', label: 'Role Created' },
    role_updated: { icon: <ShieldCheck size={18} />, color: 'text-blue-500 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-700/30', label: 'Role Updated' },
    role_deleted: { icon: <ShieldCheck size={18} />, color: 'text-red-500 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-700/30', label: 'Role Deleted' },
    permission_assigned: { icon: <KeyRound size={18} />, color: 'text-indigo-500 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-700/30', label: 'Permission Assigned' },
    permission_revoked: { icon: <KeyRound size={18} />, color: 'text-orange-500 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-700/30', label: 'Permission Revoked' },
    // Default
    default: { icon: <Info size={18} />, color: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-700/30', label: 'Activity' },
};


export default function ActivityLogsIndex({ logs, filters, users, actions, entities }) {
    const { props } = usePage();
    const authUser = props.auth?.user;
    const flash = props.flash || {};

    const queryParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

    const [userFilter, setUserFilter] = useState(
        filters.user_id ? users.filter(u => String(u.id) === String(filters.user_id)).map(u => ({ value: String(u.id), label: u.name }))[0] || null : null
    );
    const [actionFilter, setActionFilter] = useState(
        filters.action ? actions.filter(a => a === filters.action).map(a => ({ value: a, label: a.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }))[0] || null : null
    );
    const [entityFilter, setEntityFilter] = useState(
        filters.entity ? entities.filter(e => e === filters.entity).map(e => ({ value: e, label: e.split('\\').pop() }))[0] || null : null
    );
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [searchText, setSearchText] = useState(filters.search || '');
    const [showFilters, setShowFilters] = useState(false);
    const [isListMounted, setIsListMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsListMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const userOptions = users.map(u => ({ value: String(u.id), label: u.name }));
    const actionOptions = actions.map(a => ({ value: a, label: a.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }));
    const entityOptions = entities.map(e => ({ value: e, label: e.split('\\').pop() }));

    const applyFilters = () => {
        const params = {};
        if (userFilter) params.user_id = userFilter.value;
        if (actionFilter) params.action = actionFilter.value;
        if (entityFilter) params.entity = entityFilter.value;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (searchText) params.search = searchText;
        router.get(route('activity.logs'), params, { preserveState: true, preserveScroll: true, replace: true });
    };
    const resetFilters = () => {
        setUserFilter(null);
        setActionFilter(null);
        setEntityFilter(null);
        setDateFrom('');
        setDateTo('');
        setSearchText('');
        router.get(route('activity.logs'), {}, { preserveState: true, preserveScroll: true, replace: true });
    };
    
    const reactSelectStyles = {
        control: (provided, state) => ({
            ...provided, minHeight: '42px', borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
            '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#a5b4fc' },
            boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : null, borderRadius: '0.5rem',
            backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : 'white', 
        }),
        menu: (provided) => ({ ...provided, borderRadius: '0.5rem', backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : 'white', zIndex: 50 }),
        option: (provided, state) => ({ ...provided,
            backgroundColor: state.isSelected ? '#3b82f6' : (state.isFocused ? (document.documentElement.classList.contains('dark') ? '#374151' : '#eff6ff') : 'transparent'),
            color: state.isSelected ? 'white' : (document.documentElement.classList.contains('dark') ? '#d1d5db' : '#1f2937'),
            '&:hover': { backgroundColor: state.isSelected ? '#2563eb' : (document.documentElement.classList.contains('dark') ? '#4b5563' : '#dbeafe'), }
        }),
        singleValue: (provided) => ({ ...provided, color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827'}),
        placeholder: (provided) => ({ ...provided, color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'}),
        input: (provided) => ({ ...provided, color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827'}),
    };
    const commonInputClasses = "block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md h-[42px]";


    return (
        <AuthenticatedLayout user={authUser} title="Activity Logs">
            <Head title="Activity Logs" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-full mx-auto">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                        <ScrollText size={30} className="mr-3 text-blue-500" /> Activity Logs
                    </h1>
                    <button
                        type="button"
                        className="inline-flex items-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150 shadow-sm hover:shadow-md"
                        onClick={() => setShowFilters(v => !v)}
                    >
                        <SlidersHorizontal size={16} className="mr-2" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                </div>

                {flash.success && (
                    <div className="mb-5 p-4 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-200 flex items-center shadow" role="alert">
                        <CheckCircle2 size={20} className="mr-2.5 flex-shrink-0" /> <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="mb-5 p-4 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-200 flex items-center shadow" role="alert">
                        <XCircle size={20} className="mr-2.5 flex-shrink-0" /> <span>{flash.error}</span>
                    </div>
                )}

                {showFilters && (
                    <div className="mb-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl p-5 sm:p-6 transition-all duration-300 ease-in-out">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4 items-end">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">User</label>
                                <Select options={userOptions} value={userFilter} onChange={setUserFilter} placeholder="Any User" styles={reactSelectStyles} isClearable />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Action Type</label>
                                <Select options={actionOptions} value={actionFilter} onChange={setActionFilter} placeholder="Any Action" styles={reactSelectStyles} isClearable />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Entity</label>
                                <Select options={entityOptions} value={entityFilter} onChange={setEntityFilter} placeholder="Any Entity" styles={reactSelectStyles} isClearable />
                            </div>
                            <div>
                                <label htmlFor="al-search" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search Description</label>
                                <input id="al-search" type="text" className={commonInputClasses} placeholder="Keywords..." value={searchText} onChange={e => setSearchText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
                            </div>
                            <div>
                                <label htmlFor="al-dateFrom" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date From</label>
                                <input id="al-dateFrom" type="date" className={commonInputClasses} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                            </div>
                            <div>
                                <label htmlFor="al-dateTo" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date To</label>
                                <input id="al-dateTo" type="date" className={commonInputClasses} value={dateTo} onChange={e => setDateTo(e.target.value)} />
                            </div>
                            <div className="flex items-end gap-3 col-span-full sm:col-span-1 xl:col-span-2 xl:justify-end pt-4 sm:pt-0">
                                <button type="button" onClick={applyFilters} className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-all duration-150 h-[42px]">
                                    <FilterIcon size={16} className="mr-2"/>Apply
                                </button>
                                <button type="button" onClick={resetFilters} className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm hover:shadow-md transition-all duration-150 h-[42px]">
                                    <RotateCcw size={16} className="mr-2"/>Reset
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden">
                    <div className="space-y-0">
                        {logs?.data?.length > 0 ? logs.data.map((log, index) => {
                            const meta = actionDisplayMeta[log.action] || actionDisplayMeta.default;
                            return (
                            <div 
                                key={log.id}
                                className={`p-5 transition-all duration-300 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-700/40 
                                            ${index !== 0 ? 'border-t border-gray-200 dark:border-gray-700/60' : ''}
                                            ${isListMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
                                style={{ animationDelay: isListMounted ? `${index * 0.05}s` : '0s' }}
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${meta.bgColor}`}>
                                        {React.cloneElement(meta.icon, { className: meta.color })}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-0.5">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate" title={log.description}>
                                                {log.description || 'No description'}
                                            </p>
                                            <time className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 sm:mt-0 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </time>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                            <UserIcon size={12} className="mr-1.5 text-gray-400 dark:text-gray-500"/> By: {log.user ? log.user.name : 'System'} 
                                            <span className="mx-1.5 text-gray-300 dark:text-gray-600">•</span>
                                            Action: <span className={`font-medium ml-1 ${meta.textColor}`}>{meta.label}</span>
                                            {log.entity_type && <span className="mx-1.5 text-gray-300 dark:text-gray-600">•</span>}
                                            {log.entity_type && `Entity: ${log.entity_type.split('\\').pop()}`}
                                            {log.entity_id && ` (ID: ${log.entity_id})`}
                                        </p>
                                    </div>
                                </div>
                                {log.properties && Object.keys(log.properties).length > 0 && (
                                    <details className="mt-2.5 ml-0 sm:ml-14 text-xs">
                                        <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:underline focus:outline-none">View Details</summary>
                                        <pre className="mt-1.5 bg-gray-100 dark:bg-gray-900/50 rounded p-3 text-gray-600 dark:text-gray-300 overflow-x-auto border border-gray-200 dark:border-gray-700 text-[11px] leading-relaxed shadow-inner">
                                            {JSON.stringify(log.properties, null, 2)}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}) : (
                            <div className="text-center py-16 px-6">
                                <ScrollText size={56} className="mx-auto mb-5 text-gray-400 dark:text-gray-500" />
                                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">No Activity Logs Found</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    {queryParams.toString() ? 'Try adjusting your filter criteria.' : 'There are no activities recorded yet.'}
                                </p>
                            </div>
                        )}
                    </div>
                    {logs?.links && logs?.data?.length > 0 && (
                         <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-b-xl">
                            <Pagination links={logs.links} />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
