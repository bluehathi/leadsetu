import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ArrowLeft, Edit3 as EditIcon, Mail, Phone, Briefcase, Building, Tag, DollarSign, 
    CalendarDays, TrendingUp, Flame, Star, Info, AlignLeft, CheckCircle2, XCircle, 
    UserCircle2, FileText, Paperclip, User as UserIcon,
    PlusCircle, RefreshCw, StickyNote, ArrowRightLeft, Trash2,Globe // Icons from user's actionMeta
} from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

// Helper function to generate a placeholder avatar style
const getLeadAvatarPlaceholder = (name) => {
    const colors = [
        'bg-red-400', 'bg-green-400', 'bg-blue-400', 'bg-yellow-400', 
        'bg-purple-400', 'bg-indigo-400', 'bg-pink-400', 'bg-teal-400',
        'bg-cyan-400', 'bg-orange-400', 'bg-lime-400', 'bg-emerald-400'
    ];
    if (!name || name.trim() === '') name = "L"; 
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];
    
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return {
        colorClass: `${color} text-white`,
        initials: initials || name.charAt(0).toUpperCase()
    };
};

// Status and Qualification color maps (reused from leads_show_modern_ui_v1)
const statusColorMap = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
    contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200',
    qualified: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200',
    unqualified: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
    lost: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200',
    won: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-200',
    default: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
};

const qualificationColorMap = {
    Hot: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200',
    Warm: 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-200',
    Cold: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
    default: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
};

// Reusable DetailItem component (from leads_show_modern_ui_v1)
const DetailItem = ({ icon: IconComponent, label, value, isLink = false, href = "#", children, className = "" }) => {
    if (!value && value !== 0 && !children) return null;
    return (
        <div className={`flex items-start py-2.5 ${className}`}>
            {IconComponent && <IconComponent size={16} className="mr-3 mt-1 text-gray-400 dark:text-gray-500 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">{label}</span>
                {children ? (
                    <div className="text-sm text-gray-800 dark:text-gray-200 break-words mt-0.5">{children}</div>
                ) : isLink ? (
                    <a href={href} className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-words" target="_blank" rel="noopener noreferrer">
                        {value}
                    </a>
                ) : (
                    <span className="text-sm text-gray-800 dark:text-gray-200 break-words">{value}</span>
                )}
            </div>
        </div>
    );
};

// Action meta for activity timeline (from user's code)
const actionMeta = {
    lead_created: { icon: <PlusCircle size={18} className="text-green-600 dark:text-green-400" />, color: 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300 border-green-500/30 dark:border-green-500/50', label: 'Created' },
    lead_updated: { icon: <EditIcon size={18} className="text-blue-600 dark:text-blue-400" />, color: 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300 border-blue-500/30 dark:border-blue-500/50', label: 'Updated' },
    lead_deleted: { icon: <Trash2 size={18} className="text-red-600 dark:text-red-400" />, color: 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300 border-red-500/30 dark:border-red-500/50', label: 'Deleted' },
    status_changed: { icon: <RefreshCw size={18} className="text-yellow-600 dark:text-yellow-400" />, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300 border-yellow-500/30 dark:border-yellow-500/50', label: 'Status Change' },
    note_added: { icon: <StickyNote size={18} className="text-purple-600 dark:text-purple-400" />, color: 'bg-purple-100 text-purple-800 dark:bg-purple-800/30 dark:text-purple-300 border-purple-500/30 dark:border-purple-500/50', label: 'Note Added' },
    default: { icon: <ArrowRightLeft size={18} className="text-gray-500 dark:text-gray-400" />, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-500/30 dark:border-gray-500/50', label: 'Activity' },
};


export default function LeadShow({ user, lead, activityLogs: propActivityLogs, statusOptions: propStatusOptions, owners: propOwners }) {
    const { props } = usePage();
   
    const flash = props.flash || {};
    
    const activityLogs = Array.isArray(propActivityLogs) ? propActivityLogs : [];
    const leadStatusOptions = propStatusOptions || [];
    const ownersOptions = propOwners || [];

    const attachments = Array.isArray(lead.attachments)
        ? lead.attachments
        : lead.attachments && typeof lead.attachments === 'string'
        ? (() => { try { return JSON.parse(lead.attachments); } catch (e) { console.error("Failed to parse attachments:", e); return []; } })()
        : [];

    const avatar = getLeadAvatarPlaceholder(lead.name);
    const statusDisplay = leadStatusOptions.find(s => s.value === lead.status)?.label || lead.status;
    const ownerDisplay = ownersOptions.find(o => String(o.id) === String(lead.lead_owner))?.name || 'N/A';

    return (
        <AuthenticatedLayout user={user} title={`Lead: ${lead.name}`}>
            <Head title={`Lead Details - ${lead.name}`} />
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Link 
                        href={route('leads.index')} 
                        className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Leads
                    </Link>
                     <Link
                        href={route('leads.edit', lead.id)}
                        className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 text-sm font-medium"
                    >
                        <EditIcon size={18} className="mr-2 -ml-1" />
                        Edit Lead
                    </Link>
                </div>

                {flash.success && (
                    <div className="mb-5 p-4 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-200 flex items-center shadow" role="alert">
                        <CheckCircle2 size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.success}</span>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden">
                    {/* Updated Profile Banner Section */}
                    <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/30 border-b border-gray-200 dark:border-gray-700/60">
                        <div className="flex flex-col sm:flex-row items-center">
                            <div className={`w-20 h-20 sm:w-24 sm:h-24 ${avatar.colorClass} rounded-2xl flex items-center justify-center font-semibold text-3xl sm:text-4xl mr-0 sm:mr-6 mb-4 sm:mb-0 flex-shrink-0 shadow-lg border-2 border-white dark:border-slate-700`}>
                                {avatar.initials}
                            </div>
                            <div className="text-center sm:text-left flex-1 min-w-0">
                                <h1 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 truncate" title={lead.name}>
                                    {lead.name}
                                </h1>
                                <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-1.5">
                                    {lead.title && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center" title={lead.title}>
                                            <Briefcase size={14} className="mr-1.5 text-gray-400 dark:text-gray-500" />{lead.title}
                                        </p>
                                    )}
                                    {lead.company && (
                                         <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center" title={lead.company}>
                                            <Building size={14} className="mr-1.5 text-gray-400 dark:text-gray-500" />{lead.company}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 mb-6">
                            <DetailItem icon={Mail} label="Email Address" value={lead.email} isLink={!!lead.email} href={`mailto:${lead.email}`} />
                            <DetailItem icon={Phone} label="Phone Number" value={lead.phone || '-'} />
                            <DetailItem icon={Globe} label="Website" value={lead.website} isLink={!!lead.website} href={lead.website && (lead.website.startsWith('http') ? lead.website : `https://${lead.website}`)} />
                        </div>
                        
                        <hr className="dark:border-gray-700/60 my-6"/>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 mb-6">
                            <DetailItem icon={TrendingUp} label="Status">
                                 <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[lead.status] || statusColorMap.default}`}>
                                    {statusDisplay}
                                </span>
                            </DetailItem>
                            <DetailItem icon={Flame} label="Qualification">
                                {lead.qualification ? (
                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${qualificationColorMap[lead.qualification] || qualificationColorMap.default}`}>
                                        {lead.qualification === 'Hot' && <Flame size={12} className="mr-1" />}
                                        {lead.qualification === 'Warm' && <TrendingUp size={12} className="mr-1" />}
                                        {lead.qualification === 'Cold' && <Star size={12} className="mr-1" />} 
                                        {lead.qualification}
                                    </span>
                                ) : <span className="text-sm text-gray-800 dark:text-gray-200">-</span>}
                            </DetailItem>
                             <DetailItem icon={TrendingUp} label="Priority">
                                {lead.priority ? (
                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        lead.priority === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200' : 
                                        lead.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200' : 
                                        'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                                        {lead.priority}
                                    </span>
                                ) : <span className="text-sm text-gray-800 dark:text-gray-200">-</span>}
                            </DetailItem>
                            <DetailItem icon={Star} label="Lead Score" value={lead.score !== null ? lead.score : '-'} />
                            <DetailItem icon={DollarSign} label="Deal Value" value={lead.deal_value ? `$${Number(lead.deal_value).toLocaleString()}` : '-'} />
                             <DetailItem icon={CalendarDays} label="Expected Close Date" value={lead.expected_close ? new Date(lead.expected_close).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'} />
                            <DetailItem icon={UserCircle2} label="Lead Owner" value={ownerDisplay} />
                            <DetailItem icon={CalendarDays} label="Added On" value={new Date(lead.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                        </div>

                        {lead.tags && Array.isArray(lead.tags) && lead.tags.length > 0 && (
                            <>
                            <hr className="dark:border-gray-700/60 my-6"/>
                            <DetailItem icon={Tag} label="Tags" className="md:col-span-3">
                                <div className="flex flex-wrap gap-2">
                                    {lead.tags.map((tag, idx) => (
                                        <span key={idx} className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md px-2.5 py-1 text-xs font-medium">{tag}</span>
                                    ))}
                                </div>
                            </DetailItem>
                            </>
                        )}
                        
                        {lead.notes && (
                            <>
                            <hr className="dark:border-gray-700/60 my-6"/>
                            <DetailItem icon={AlignLeft} label="Notes" className="md:col-span-3">
                                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{lead.notes}</p>
                            </DetailItem>
                            </>
                        )}

                        {attachments && attachments.length > 0 && (
                            <>
                            <hr className="dark:border-gray-700/60 my-6"/>
                            <DetailItem icon={Paperclip} label="Attachments" className="md:col-span-3">
                                <ul className="list-disc list-inside space-y-1">
                                    {attachments.map((file, idx) => (
                                        <li key={idx} className="text-sm">
                                            {file.url ? (
                                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                                    {file.name || `Attachment ${idx + 1}`}
                                                </a>
                                            ) : (
                                                <span>{file.name || file}</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </DetailItem>
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-8 bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden">
                    <div className="p-6 sm:p-8 border-b border-gray-200 dark:border-gray-700/60">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                            <Info size={20} className="mr-3 text-blue-500" /> Activity Timeline
                        </h2>
                    </div>
                    <div className="p-6 sm:p-8">
                        {activityLogs.length === 0 ? (
                            <div className="text-gray-500 dark:text-gray-400 text-center py-10">
                                <StickyNote size={40} className="mx-auto mb-3 text-gray-400" />
                                No activity found for this lead.
                            </div>
                        ) : (
                            <ol className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3">
                                {activityLogs.map(log => {
                                    const meta = actionMeta[log.action] || actionMeta.default;
                                    return (
                                        <li key={log.id} className="mb-8 ml-8 relative">
                                            <span className={`absolute -left-[23px] flex items-center justify-center w-10 h-10 rounded-full ring-4 ring-white dark:ring-gray-800 shadow-md border-2 ${meta.color}`}>
                                                {meta.icon}
                                            </span>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 ml-2">
                                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                                                        <UserIcon size={14} className="inline-block text-gray-400 dark:text-gray-500" />
                                                        {log.user ? log.user.name : 'System'}
                                                    </span>
                                                    <time className="text-xs font-normal text-gray-400 dark:text-gray-500">
                                                        {new Date(log.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </time>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1.5">{log.description}</p>
                                                {log.properties && Object.keys(log.properties).length > 0 && (
                                                    <details className="mt-2 text-xs">
                                                        <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:underline">View Details</summary>
                                                        <pre className="mt-1 bg-gray-100 dark:bg-gray-900/50 rounded p-2.5 text-gray-600 dark:text-gray-300 overflow-x-auto border border-gray-200 dark:border-gray-700 text-[11px] leading-relaxed">
                                                            {JSON.stringify(log.properties, null, 2)}
                                                        </pre>
                                                    </details>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
