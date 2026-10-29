import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Search, CheckCircle2, XCircle, SlidersHorizontal, RotateCcw, Filter as FilterIcon } from 'lucide-react';
import Pagination from '@/Components/Pagination';

export default function ProspectListsIndex({ user, lists, filters }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const [searchText, setSearchText] = useState(filters?.search || '');
    const [perPage, setPerPage] = useState(filters?.per_page || 15);
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    useEffect(() => {
        setSearchText(filters?.search || '');
        setPerPage(filters?.per_page || 15);
    }, [filters]);

    const handleSearchInputChange = (e) => setSearchText(e.target.value);

    const applyFilters = () => {
        const params = {};
        if (searchText) params.search = searchText;
        if (perPage) params.per_page = perPage;
        router.get(route('prospect-lists.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setSearchText('');
        setPerPage(15);
        router.get(route('prospect-lists.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleDelete = (listId, listName) => {
        if (confirm(`Are you sure you want to delete the list "${listName}"? This action cannot be undone.`)) {
            router.delete(route('prospect-lists.destroy', listId), {
                preserveScroll: true,
            });
        }
    };

    const displayedLists = lists && lists.data ? lists.data : [];

    return (
        <AuthenticatedLayout user={user} title="Prospect Lists">
            <Head title="Prospect Lists" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 w-full mx-auto">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full flex flex-1/2 items-center">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md"
                            placeholder="Search prospect lists..."
                            value={searchText}
                            onChange={handleSearchInputChange}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('prospect-lists.create')}
                            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm font-medium"
                        >
                            <Plus size={18} className="mr-2 -ml-1" />
                            Add
                        </Link>
                        <button
                            type="button"
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className="inline-flex items-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150 shadow-sm hover:shadow-md"
                        >
                            <SlidersHorizontal size={16} className="mr-2" />
                            {showFilterPanel ? 'Hide Filters' : 'Show Filters'}
                        </button>
                    </div>
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

                {showFilterPanel && (
                    <div className="mb-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6 transition-all duration-300 ease-in-out">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
                            <div className="min-w-[180px]">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Per Page</label>
                                <select
                                    value={perPage}
                                    onChange={e => setPerPage(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md h-[42px]"
                                >
                                    {[10, 15, 25, 50, 100].map(num => (
                                        <option key={num} value={num}>{num}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end gap-3 md:col-span-full lg:col-span-1 xl:col-auto justify-end w-full">
                                <button type="button" onClick={applyFilters} className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-all duration-150 h-[42px]">
                                    <FilterIcon size={16} className="mr-2" />Apply
                                </button>
                                <button type="button" onClick={resetFilters} className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm hover:shadow-md transition-all duration-150 h-[42px]">
                                    <RotateCcw size={16} className="mr-2" />Reset
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {displayedLists.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {displayedLists.map((list) => (
                            <div key={list.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-5 flex flex-col gap-2 relative group border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <Link href={route('prospect-lists.show', list.id)} className="text-lg font-semibold text-blue-700 dark:text-blue-300 hover:underline">
                                        {list.name}
                                    </Link>
                                    <div className="flex gap-2">
                                        <Link href={route('prospect-lists.edit', list.id)} className="text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-300">Edit</Link>
                                        <button onClick={() => handleDelete(list.id, list.name)} className="text-xs text-red-500 hover:underline">Delete</button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">{list.description}</div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{list.contacts_count} contacts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 px-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl">
                        <Search size={60} className="mx-auto mb-6 text-gray-400 dark:text-gray-500" />
                        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                            {searchText ? 'No prospect lists match your criteria.' : 'No prospect lists found.'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2.5">
                            {searchText ? 'Try adjusting your search or filter options.' : 'Get started by adding a new prospect list.'}
                        </p>
                        {!searchText && (
                            <Link
                                href={route('prospect-lists.create')}
                                className="mt-8 inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                            >
                                <Plus size={18} className="mr-2" /> Add New Prospect List
                            </Link>
                        )}
                    </div>
                )}

                {lists && lists.links && lists.data && lists.data.length > 0 && (
                    <div className="mt-8">
                        <Pagination links={lists.links} />
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
