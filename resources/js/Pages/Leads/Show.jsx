import React from 'react';
import { Head, Link,usePage } from '@inertiajs/react';
import Sidebar from '@/Components/parts/Sidebar';
import { User2, User, Info, FileText, PlusCircle, Edit3, Trash2, RefreshCw, StickyNote, ArrowRightLeft, Mail, Phone, BriefcaseBusiness, Globe, DollarSign, Calendar } from 'lucide-react';
import AutheticatedLayout from '@/Layouts/AuthenticatedLayout';
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
    
    const { props } = usePage();
    activityLogs = Array.isArray(activityLogs) ? activityLogs : [];
    const attachments = Array.isArray(lead.attachments)
        ? lead.attachments
        : lead.attachments
            ? (typeof lead.attachments === 'string' ? JSON.parse(lead.attachments) : [])
            : [];

    return (
        <>
        <AutheticatedLayout user={user} title={`Lead: ${lead.name}`}>
            <Head title={`Lead: ${lead.name}`} />
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    <main className="flex-1 relative overflow-y-auto focus:outline-none">
                        <div className="py-8 px-2 sm:px-4 lg:px-8 w-full  mx-auto">
                            {/* Lead Main Card */}
                            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 mb-8 border border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
                                    <div className="flex items-center gap-4">
                                        <User2 size={44} className="text-blue-500 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 rounded-full p-2" />
                                        <div>
                                            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                                {lead.name}
                                                {lead.status && (
                                                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${lead.status === 'won' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : lead.status === 'lost' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>{lead.status}</span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                                                <Mail size={14} className="inline-block mr-1" />{lead.email || '-'}
                                                <Phone size={14} className="inline-block ml-4 mr-1" />{lead.phone || '-'}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {lead.title && <span className="inline-block bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold">{lead.title}</span>}
                                                {lead.positions && <span className="inline-block bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold">{lead.positions}</span>}
                                                {Array.isArray(lead.tags) && lead.tags.length > 0 && lead.tags.map((tag, idx) => (
                                                    <span key={idx} className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full px-2 py-0.5 text-xs font-semibold">{tag}</span>
                                                ))}
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
                                {/* Status/Qualification/Score Row */}
                                <div className="flex flex-wrap gap-3 mt-2 mb-6">
                                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-semibold">Status: {lead.status}</span>
                                    <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs font-semibold">Score: {lead.score ?? '-'}</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${lead.qualification === 'Hot' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : lead.qualification === 'Warm' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>Qualification: {lead.qualification}</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${lead.priority === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : lead.priority === 'Low' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>Priority: {lead.priority || '-'}</span>
                                </div>
                                {/* Company/Contact/Deal Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                            <BriefcaseBusiness size={16} />
                                            <span className="font-semibold">Company:</span> {lead.company?.name || lead.company || '-'}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                            <User2 size={16} />
                                            <span className="font-semibold">Contact:</span> {lead.contact?.name || '-'}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                            <Globe size={16} />
                                            <span className="font-semibold">Website:</span> {lead.website || '-'}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                            <DollarSign size={16} />
                                            <span className="font-semibold">Deal Value:</span> {lead.deal_value ? `₹${lead.deal_value}` : '-'}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                            <Calendar size={16} />
                                            <span className="font-semibold">Expected Close:</span> {lead.expected_close || '-'}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                            <User size={16} />
                                            <span className="font-semibold">Lead Owner:</span> {lead.lead_owner || '-'}
                                        </div>
                                    </div>
                                </div>
                                {/* Notes Section */}
                                {lead.notes && (
                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-gray-700 dark:text-gray-200 text-sm border border-gray-100 dark:border-gray-800">
                                        <span className="font-semibold text-gray-600 dark:text-gray-300">Notes:</span> {lead.notes}
                                    </div>
                                )}
                                {/* Attachments Section */}
                                <div className="mt-4">
                                    <span className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Attachments</span>
                                    {attachments && attachments.length > 0 ? (
                                        <ul className="text-xs text-gray-700 dark:text-gray-200">
                                            {attachments.map((file, idx) => (
                                                <li key={idx} className="truncate">{file.name || file}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="block text-base text-gray-900 dark:text-gray-100">-</span>
                                    )}
                                </div>
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
            </AutheticatedLayout>
        </>
    );
}