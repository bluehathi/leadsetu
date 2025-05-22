import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Sidebar from '@/Components/parts/Sidebar';
import { User, Info, FileText, PlusCircle, Edit3, Trash2, RefreshCw, StickyNote, ArrowRightLeft, Mail, Phone, Building2, Globe } from 'lucide-react';

// Map action types to icons and colors
const actionMeta = {
    lead_created: { icon: <PlusCircle size={16} className="text-green-600 dark:text-green-300" />, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Created' },
    lead_updated: { icon: <Edit3 size={16} className="text-blue-600 dark:text-blue-300" />, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Updated' },
    lead_deleted: { icon: <Trash2 size={16} className="text-red-600 dark:text-red-300" />, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Deleted' },
    status_changed: { icon: <RefreshCw size={16} className="text-yellow-600 dark:text-yellow-300" />, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Status Changed' },
    note_added: { icon: <StickyNote size={16} className="text-purple-600 dark:text-purple-300" />, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', label: 'Note' },
    default: { icon: <ArrowRightLeft size={16} className="text-gray-400" />, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', label: 'Activity' },
};

export default function LeadShow({ user, lead, activityLogs }) {
    return (
        <>
            <Head title={`Lead: ${lead.name}`} />
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
                <Sidebar user={user} />
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    <main className="flex-1 relative overflow-y-auto focus:outline-none">
                        <div className="py-8 px-2 sm:px-4 lg:px-8 w-full">
                            {/* Lead Info Card */}
                            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 mb-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <User size={36} className="text-blue-500 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 rounded-full p-2" />
                                        <div>
                                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-1">{lead.name}</h1>
                                            <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-300">
                                                {lead.email && <span className="flex items-center gap-1"><Mail size={14} />{lead.email}</span>}
                                                {lead.phone && <span className="flex items-center gap-1"><Phone size={14} />{lead.phone}</span>}
                                                {lead.company && <span className="flex items-center gap-1"><Building2 size={14} />{lead.company}</span>}
                                                {lead.website && <span className="flex items-center gap-1"><Globe size={14} />{lead.website}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Link href={route('leads.edit', lead.id)} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 transition shadow">
                                            <Edit3 size={16} className="mr-1" /> Edit
                                        </Link>
                                        <Link href={route('leads.index')} className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-xs font-semibold hover:bg-gray-300 transition shadow">
                                            Back
                                        </Link>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-semibold">Status: {lead.status}</span>
                                    <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs font-semibold">Score: {lead.score ?? '-'}</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${lead.qualification === 'Hot' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : lead.qualification === 'Warm' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>Qualification: {lead.qualification}</span>
                                </div>
                                {lead.notes && (
                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-gray-700 dark:text-gray-200 text-sm border border-gray-100 dark:border-gray-800">
                                        <span className="font-semibold text-gray-600 dark:text-gray-300">Notes:</span> {lead.notes}
                                    </div>
                                )}
                            </div>

                            {/* Timeline / Activity Feed */}
                            <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mt-0">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2"><Info size={20}/> Activity Timeline</h2>
                                {activityLogs.length === 0 ? (
                                    <div className="text-gray-500 dark:text-gray-300 text-center py-8">No activity found for this lead.</div>
                                ) : (
                                    <ol className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-2">
                                        {activityLogs.map(log => {
                                            const meta = actionMeta[log.action] || actionMeta.default;
                                            return (
                                                <li key={log.id} className="mb-10 ml-6 relative">
                                                    <span className={`absolute -left-5 flex items-center justify-center w-10 h-10 rounded-full ring-8 ring-white dark:ring-gray-900 ${meta.color} shadow`}>
                                                        {meta.icon}
                                                    </span>
                                                    <div className="flex items-center gap-2 mb-1 mt-1">
                                                        <span className="font-semibold text-gray-800 dark:text-white flex items-center gap-1">
                                                            <User size={14} className="inline-block text-gray-400 mr-1" />
                                                            {log.user ? log.user.name : 'System'}
                                                        </span>
                                                        <span className="text-xs text-gray-400">&bull; {new Date(log.created_at).toLocaleString()}</span>
                                                        <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                                                        <span className="font-semibold">{log.action.replace('_', ' ').toUpperCase()}</span>: {log.description}
                                                    </div>
                                                    {log.properties && Object.keys(log.properties).length > 0 && (
                                                        <pre className="bg-gray-50 dark:bg-gray-900 rounded p-2 text-xs text-gray-600 dark:text-gray-300 overflow-x-auto mt-1 border border-gray-100 dark:border-gray-800"><FileText size={12} className="inline mr-1" />{JSON.stringify(log.properties, null, 2)}</pre>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ol>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
} 