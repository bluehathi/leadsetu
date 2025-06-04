import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PlusCircle, Eye, Inbox, CheckCircle2, Edit3, Trash2, Search, SlidersHorizontal, RotateCcw, CalendarDays, Send, Filter as FilterIcon, Trash } from 'lucide-react'; // Lucide React icons
 
// Simple Pagination (if you don't have a dedicated component)
const SimplePagination = ({ links }) => {
    if (!links || links.length <= 3) return null; // Hide if only prev, current, next or less

    return (
        <nav className="mt-6 flex items-center justify-center space-x-1">
            {links.map((link, index) => (
                <Link
                    key={index}
                    href={link.url || '#'}
                    className={`px-3 py-2 text-sm rounded-md
                        ${link.active ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                        ${!link.url ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : ''}
                        transition-colors duration-150 ease-in-out`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                    as={!link.url ? 'span' : 'a'} // Render as span if no URL
                />
            ))}
        </nav>
    );
};

// Helper to format status
const CampaignStatusBadge = ({ status }) => {
    let bgColor = 'bg-gray-100 dark:bg-gray-700';
    let textColor = 'text-gray-700 dark:text-gray-300';
    let dotColor = 'bg-gray-400';

    switch (status?.toLowerCase()) {
        case 'draft':
            bgColor = 'bg-yellow-100 dark:bg-yellow-700/50';
            textColor = 'text-yellow-800 dark:text-yellow-300';
            dotColor = 'bg-yellow-500';
            break;
        case 'scheduled':
            bgColor = 'bg-blue-100 dark:bg-blue-700/50';
            textColor = 'text-blue-800 dark:text-blue-300';
            dotColor = 'bg-blue-500';
            break;
        case 'sending':
            bgColor = 'bg-teal-100 dark:bg-teal-700/50';
            textColor = 'text-teal-800 dark:text-teal-300';
            dotColor = 'bg-teal-500';
            break;
        case 'sent':
            bgColor = 'bg-green-100 dark:bg-green-700/50';
            textColor = 'text-green-800 dark:text-green-300';
            dotColor = 'bg-green-500';
            break;
        case 'failed':
            bgColor = 'bg-red-100 dark:bg-red-700/50';
            textColor = 'text-red-800 dark:text-red-300';
            dotColor = 'bg-red-500';
            break;
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
            <span className={`w-2 h-2 mr-1.5 rounded-full ${dotColor}`}></span>
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
        </span>
    );
};


export default function EmailCampaignsIndex({ campaigns, user, filters: initialFilters }) {
    const { props } = usePage();
    const flash = props.flash || {}; // For potential flash messages
    const [searchTerm, setSearchTerm] = useState(initialFilters?.search || '');
    const [statusFilter, setStatusFilter] = useState(initialFilters?.status || '');
    const [selectedCampaignIds, setSelectedCampaignIds] = useState([]);
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    useEffect(() => {
        setSearchTerm(initialFilters?.search || '');
        setStatusFilter(initialFilters?.status || '');
    }, [initialFilters]);

    useEffect(() => {
        // Clear selection when filters change or data reloads
        setSelectedCampaignIds([]);
    }, [campaigns.data]);
    const handleFilterChange = () => {
        const params = {};
        if (searchTerm) params.search = searchTerm;
        if (statusFilter) params.status = statusFilter;
        // Preserve page number if not explicitly changing filters that would reset it
        // For simplicity, we'll let Inertia handle it or reset to page 1
        router.get(route('email-campaigns.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onSuccess: () => setSelectedCampaignIds([]) // Clear selection on new data
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        router.get(route('email-campaigns.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onSuccess: () => setSelectedCampaignIds([]) // Clear selection
        });
    };

    const handleDelete = (campaignId, campaignName) => {
        if (confirm(`Are you sure you want to delete the campaign "${campaignName}"? This action cannot be undone.`)) {
            router.delete(route('email-campaigns.destroy', campaignId), {
                preserveScroll: true,
                onSuccess: () => setSelectedCampaignIds(prev => prev.filter(id => id !== campaignId))
            });
        }
    };

    const handleSelectCampaign = (campaignId) => {
        setSelectedCampaignIds(prevSelected =>
            prevSelected.includes(campaignId)
                ? prevSelected.filter(id => id !== campaignId)
                : [...prevSelected, campaignId]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allCampaignIds = campaigns.data.map(c => c.id);
            setSelectedCampaignIds(allCampaignIds);
        } else {
            setSelectedCampaignIds([]);
        }
    };

    const handleBulkDelete = () => {
        if (selectedCampaignIds.length === 0) return;
        if (confirm(`Are you sure you want to delete ${selectedCampaignIds.length} selected campaign(s)? This action cannot be undone.`)) {
            router.post(route('email-campaigns.bulk-destroy'), { ids: selectedCampaignIds }, {
                preserveScroll: true,
                onSuccess: () => setSelectedCampaignIds([])
            });
        }
    };

    const isAllSelected = campaigns.data.length > 0 && selectedCampaignIds.length === campaigns.data.length;
    const isAnySelected = selectedCampaignIds.length > 0;


    return (
        <AuthenticatedLayout
            user={user}
            title="Email Campaigns"
        >
            <Head title="Email Campaigns" />

            <div className="py-12 font-sans">
                <div className="w-full mx-auto sm:px-6 lg:px-8"> {/* Wider for table data */}

                    {/* Flash Messages (Example) */}
                    {flash.success && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-700/30 border border-green-400 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-100 flex items-start shadow-md" role="alert">
                            <CheckCircle2 className="h-5 w-5 mr-3 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span>{flash.success}</span>
                        </div>
                    )}

                    <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="relative w-full flex-grow sm:flex-grow-0 sm:w-1/2 md:w-2/5">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md"
                                placeholder="Search by name or subject..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowFilterPanel(!showFilterPanel)}
                                className="inline-flex items-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-150 shadow-sm hover:shadow-md"
                                aria-controls="filter-panel"
                                aria-expanded={showFilterPanel}
                            >
                                <SlidersHorizontal size={16} className="mr-2" />
                                {showFilterPanel ? 'Hide Filters' : 'Show Filters'}
                            </button>
                            <Link
                                href={route('email-campaigns.create')}
                                className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all duration-150 ease-in-out"
                            >
                                <PlusCircle size={18} className="mr-2 -ml-1" /> New Campaign
                            </Link>
                        </div>
                    </div>

                    {showFilterPanel && (
                        <div id="filter-panel" className="mb-6 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 sm:p-6 transition-all duration-300 ease-in-out">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label htmlFor="statusFilter" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select
                                        id="statusFilter"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md h-[42px]"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="draft">Draft</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="sending">Sending</option>
                                        <option value="sent">Sent</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>
                                <div className="flex items-end gap-3 md:col-start-2 lg:col-start-3 justify-end">
                                    <button type="button" onClick={handleFilterChange} className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md hover:shadow-lg transition-all duration-150 h-[42px]">
                                        <FilterIcon size={16} className="mr-2" />Apply
                                    </button>
                                    <button type="button" onClick={resetFilters} className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm hover:shadow-md transition-all duration-150 h-[42px]">
                                        <RotateCcw size={16} className="mr-2" />Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isAnySelected && (
                        <div className="mb-6 p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg flex items-center justify-between shadow-sm">
                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-200">
                                {selectedCampaignIds.length} campaign(s) selected.
                            </span>
                            <button
                                onClick={handleBulkDelete}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-colors"
                            >
                                <Trash size={14} className="mr-1.5" />
                                Delete Selected
                            </button>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 shadow-xl overflow-hidden rounded-xl">
                        <div className="">
                            {campaigns.data && campaigns.data.length === 0 ? (
                                <div className="text-center py-12">
                                    <Inbox size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No Campaigns Yet</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                        {searchTerm || statusFilter ? 'No campaigns match your current filters.' : "It looks like you haven't created any email campaigns."}
                                    </p>
                                    <Link
                                        href={route('email-campaigns.create')}
                                        className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all"
                                    >
                                        <PlusCircle size={18} className="mr-2 -ml-1" /> Create Your First Campaign
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th scope="col" className="px-4 py-3 text-left">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-indigo-500 dark:focus:ring-indigo-400"
                                                        checked={isAllSelected}
                                                        onChange={handleSelectAll}
                                                        disabled={campaigns.data.length === 0}
                                                    />
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Campaign Name</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Prospect List(s)</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Updated</th>
                                                <th scope="col" className="relative px-6 py-3">
                                                    <span className="sr-only">Actions</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {campaigns.data.map(campaign => (
                                                <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150 group">
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-indigo-500 dark:focus:ring-indigo-400"
                                                            checked={selectedCampaignIds.includes(campaign.id)}
                                                            onChange={() => handleSelectCampaign(campaign.id)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{campaign.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={campaign.subject}>{campaign.subject}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <CampaignStatusBadge status={campaign.status} />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                        {Array.isArray(campaign.prospect_lists) && campaign.prospect_lists.length > 0
                                                            ? campaign.prospect_lists.map(pl => pl.name).join(', ')
                                                            : <span className="italic text-gray-400 dark:text-gray-500">-</span>}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                        <div className="flex items-center">
                                                            <CalendarDays size={14} className="mr-1.5 text-gray-400 dark:text-gray-500" />
                                                            {new Date(campaign.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </div>
                                                        <div className="text-xs text-gray-400 dark:text-gray-500">
                                                            {new Date(campaign.updated_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <Link href={route('email-campaigns.show', campaign.id)} className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 rounded-md hover:bg-indigo-100 dark:hover:bg-gray-700" title="View">
                                                                <Eye size={16} />
                                                            </Link>
                                                            {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                                                                <Link href={route('email-campaigns.edit', campaign.id)} className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-gray-700" title="Edit">
                                                                    <Edit3 size={16} />
                                                                </Link>)}
                                                            <button
                                                                onClick={() => handleDelete(campaign.id, campaign.name)}
                                                                className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-gray-700" // Added closing angle bracket
                                                                // className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-gray-700" // Original line
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {/* Pagination */}
                            {campaigns.data && campaigns.data.length > 0 && <SimplePagination links={campaigns.links} />}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout >
    );
}
