import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PlusCircle, Eye, Inbox, ChevronRight, ListFilter, CalendarDays, Users, Send } from 'lucide-react'; // Lucide React icons

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


export default function EmailCampaignsIndex({ campaigns, user }) {
    const { props } = usePage();
    const flash = props.flash || {}; // For potential flash messages

    return (
        <AuthenticatedLayout
            user={user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight flex items-center">
                    <Send size={24} className="mr-3 text-indigo-500" /> Email Campaigns
                </h2>
            }
        >
            <Head title="Email Campaigns" />

            <div className="py-12 font-sans">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8"> {/* Wider for table data */}

                    {/* Flash Messages (Example) */}
                    {flash.success && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-700/30 border border-green-400 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-100 flex items-start shadow-md" role="alert">
                            <CheckCircle2 className="h-5 w-5 mr-3 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span>{flash.success}</span>
                        </div>
                    )}

                    <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                Manage Campaigns
                            </h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                View, create, and manage your email marketing campaigns.
                            </p>
                        </div>
                        <Link
                            href={route('email-campaigns.create')}
                            className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all duration-150 ease-in-out"
                        >
                            <PlusCircle size={18} className="mr-2 -ml-1" /> New Campaign
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow-xl overflow-hidden rounded-xl">
                        <div className="">
                            {/* Optional: Filters section can be added here */}
                            {/* <div className="mb-6 flex items-center gap-4">
                                <ListFilter size={20} className="text-gray-500 dark:text-gray-400" />
                                <input type="text" placeholder="Filter by name..." className="..."/>
                            </div> */}

                            {campaigns.data.length === 0 ? (
                                <div className="text-center py-12">
                                    <Inbox size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No Campaigns Yet</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                        It looks like you haven't created any email campaigns.
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
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Campaign Name</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Prospect List(s)</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created At</th>
                                                <th scope="col" className="relative px-6 py-3">
                                                    <span className="sr-only">Actions</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {campaigns.data.map(campaign => (
                                                <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150">
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
                                                            {new Date(campaign.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </div>
                                                        <div className="text-xs text-gray-400 dark:text-gray-500">
                                                            {new Date(campaign.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Link href={route('email-campaigns.show', campaign.id)} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 group">
                                                            View <Eye size={16} className="ml-1.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {/* Pagination */}
                            {campaigns.data.length > 0 && <SimplePagination links={campaigns.links} />}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
