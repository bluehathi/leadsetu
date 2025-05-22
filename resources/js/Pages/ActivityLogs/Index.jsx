import React from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import Sidebar from '@/Components/parts/Sidebar';
import Pagination from '@/Components/Pagination';

export default function ActivityLogsIndex({ logs, filters, users, actions, entities }) {
    const { props } = usePage();

    // Helper function to generate filter URLs
    const getFilterUrl = (newFilters) => {
        const params = new URLSearchParams();
        const finalFilters = { ...filters, ...newFilters };
        Object.entries(finalFilters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        return `${window.location.pathname}?${params.toString()}`;
    };

    return (
        <>
            <Head title="Activity Logs" />
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
                <Sidebar user={props.auth?.user} />
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    <main className="flex-1 relative overflow-y-auto focus:outline-none">
                        <div className="py-8 px-4 sm:px-6 lg:px-8">
                            <div className="mb-6 flex flex-col gap-4">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                                    Activity Logs
                                </h1>
                                {/* Filters Section */}
                                <div className="w-full sm:w-auto bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm px-6 py-4 flex flex-col sm:flex-row gap-4 items-center">
                                    {/* User Filter */}
                                    <div className="flex flex-col min-w-[160px]">
                                        <label className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                            <span>👤</span> User
                                        </label>
                                        <select
                                            value={filters.user_id || ''}
                                            onChange={e => window.location.href = getFilterUrl({ user_id: e.target.value || null })}
                                            className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2"
                                        >
                                            <option value="">All Users</option>
                                            {users?.map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Action Filter */}
                                    <div className="flex flex-col min-w-[160px]">
                                        <label className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                            <span>⚡</span> Action
                                        </label>
                                        <select
                                            value={filters.action || ''}
                                            onChange={e => window.location.href = getFilterUrl({ action: e.target.value || null })}
                                            className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2"
                                        >
                                            <option value="">All Actions</option>
                                            {actions?.map(action => (
                                                <option key={action} value={action}>{action.replace('_', ' ').toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Entity Filter */}
                                    <div className="flex flex-col min-w-[160px]">
                                        <label className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                            <span>📦</span> Entity
                                        </label>
                                        <select
                                            value={filters.entity || ''}
                                            onChange={e => window.location.href = getFilterUrl({ entity: e.target.value || null })}
                                            className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2"
                                        >
                                            <option value="">All Entities</option>
                                            {entities?.map(entity => (
                                                <option key={entity} value={entity}>{entity.split('\\').pop()}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Date Filter */}
                                    <div className="flex flex-col min-w-[160px]">
                                        <label className="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                            <span>📅</span> Date
                                        </label>
                                        <input
                                            type="date"
                                            value={filters.date || ''}
                                            onChange={e => window.location.href = getFilterUrl({ date: e.target.value || null })}
                                            className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2"
                                        />
                                    </div>

                                    {/* Reset Filters Button */}
                                    <div className="flex flex-col justify-end min-w-[120px]">
                                        <button
                                            type="button"
                                            onClick={() => window.location.href = window.location.pathname}
                                            className="mt-5 sm:mt-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md px-4 py-2 text-xs font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition"
                                        >
                                            Reset Filters
                                        </button>
                                    </div>
                                </div>
                            </div>
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
