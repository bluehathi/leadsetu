import React, { useState, useMemo } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import Sidebar from '@/Components/parts/Sidebar';
import Pagination from '@/Components/Pagination';
import Select from 'react-select';

export default function ActivityLogsIndex({ logs, filters, users, actions, entities }) {
    const { props } = usePage();

    // --- Filter State ---
    const [userMulti, setUserMulti] = useState(
        filters.user_id
            ? users.filter(u => String(u.id) === String(filters.user_id)).map(u => ({ value: String(u.id), label: u.name }))
            : []
    );
    const [actionMulti, setActionMulti] = useState(
        filters.action
            ? actions.filter(a => a === filters.action).map(a => ({ value: a, label: a.replace('_', ' ').toUpperCase() }))
            : []
    );
    const [entityMulti, setEntityMulti] = useState(
        filters.entity
            ? entities.filter(e => e === filters.entity).map(e => ({ value: e, label: e.split('\\').pop() }))
            : []
    );
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [searchText, setSearchText] = useState(filters.search || '');
    const [showFilters, setShowFilters] = useState(false);

    // --- Filter Options ---
    const userOptions = users.map(u => ({ value: String(u.id), label: u.name }));
    const actionOptions = actions.map(a => ({ value: a, label: a.replace('_', ' ').toUpperCase() }));
    const entityOptions = entities.map(e => ({ value: e, label: e.split('\\').pop() }));

    // --- Filter Handler ---
    const applyFilters = () => {
        const params = {};
        if (userMulti.length > 0) params.user_id = userMulti[0].value;
        if (actionMulti.length > 0) params.action = actionMulti[0].value;
        if (entityMulti.length > 0) params.entity = entityMulti[0].value;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (searchText) params.search = searchText;
        router.get(window.location.pathname, params, { preserveState: true });
    };
    const resetFilters = () => {
        setUserMulti([]);
        setActionMulti([]);
        setEntityMulti([]);
        setDateFrom('');
        setDateTo('');
        setSearchText('');
        router.get(window.location.pathname, {}, { preserveState: true });
    };

    return (
        <>
            <Head title="Activity Logs" />
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
                <Sidebar user={props.auth?.user} />
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    <main className="flex-1 relative overflow-y-auto focus:outline-none">
                        <div className="py-8 px-4 sm:px-6 lg:px-8">
                            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                                    Activity Logs
                                </h1>
                                <div className="flex gap-2 items-center">
                                    <button
                                        type="button"
                                        className="w-auto inline-block px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition shadow"
                                        onClick={() => setShowFilters(v => !v)}
                                    >
                                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                                    </button>
                                </div>
                            </div>
                            {/* Filter Bar (toggleable) */}
                            {showFilters && (
                                <div className="mb-6 bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-wrap gap-4 items-center">
                                    <div className="min-w-[180px]">
                                        <Select
                                            isMulti={false}
                                            options={userOptions}
                                            value={userMulti}
                                            onChange={v => setUserMulti(v ? [v] : [])}
                                            placeholder="User"
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                    <div className="min-w-[180px]">
                                        <Select
                                            isMulti={false}
                                            options={actionOptions}
                                            value={actionMulti}
                                            onChange={v => setActionMulti(v ? [v] : [])}
                                            placeholder="Action"
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                    <div className="min-w-[180px]">
                                        <Select
                                            isMulti={false}
                                            options={entityOptions}
                                            value={entityMulti}
                                            onChange={v => setEntityMulti(v ? [v] : [])}
                                            placeholder="Entity"
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            className="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm px-3 py-2"
                                            value={dateFrom}
                                            onChange={e => setDateFrom(e.target.value)}
                                            placeholder="From"
                                        />
                                        <span>-</span>
                                        <input
                                            type="date"
                                            className="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm px-3 py-2"
                                            value={dateTo}
                                            onChange={e => setDateTo(e.target.value)}
                                            placeholder="To"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            className="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm px-3 py-2 min-w-[180px]"
                                            placeholder="Search description..."
                                            value={searchText}
                                            onChange={e => setSearchText(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="ml-2 px-4 py-2 rounded-full border border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-800 transition"
                                        onClick={applyFilters}
                                    >
                                        Apply
                                    </button>
                                    <button
                                        type="button"
                                        className="ml-2 px-4 py-2 rounded-full border border-gray-400 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                        onClick={resetFilters}
                                    >
                                        Reset
                                    </button>
                                </div>
                            )}
                            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {logs?.data?.length > 0 ? logs.data.map(log => (
                                            <tr key={log.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{new Date(log.created_at).toLocaleString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{log.user ? log.user.name : 'System'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{log.action}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{log.description}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-300">
                                                    <pre className="whitespace-pre-wrap break-all">{log.properties ? JSON.stringify(log.properties, null, 2) : ''}</pre>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-300">No activity logs found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                {/* Pagination */}
                                {logs?.links && (
                                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                                        <Pagination links={logs.links} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
