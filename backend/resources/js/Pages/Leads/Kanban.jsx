import React, { useState, useEffect } from 'react'; // Added useEffect
import { Head, Link, usePage, router } from '@inertiajs/react';
import { 
    User, Building2, Mail, Tag, Calendar, Star, ArrowRightLeft, PlusCircle, 
    RefreshCw, CheckCircle, XCircle as XCircleIcon, Plus, Eye, Edit2, GripVertical 
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

const statusColumns = [
    { key: 'new', label: 'New' },
    { key: 'contacted', label: 'Contacted' },
    { key: 'qualified', label: 'Qualified' },
    { key: 'unqualified', label: 'Unqualified' },
    { key: 'lost', label: 'Lost Deal' },
    { key: 'won', label: 'Won Deal' },
];

const statusMeta = {
    new:        { color: 'border-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-300', icon: <PlusCircle size={18} className="text-blue-500" /> },
    contacted:  { color: 'border-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/30', textColor: 'text-yellow-700 dark:text-yellow-300', icon: <Mail size={18} className="text-yellow-500" /> },
    qualified:  { color: 'border-green-500', bgColor: 'bg-green-50 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-300', icon: <CheckCircle size={18} className="text-green-500" /> },
    unqualified:{ color: 'border-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-700/30', textColor: 'text-gray-700 dark:text-gray-300', icon: <XCircleIcon size={18} className="text-gray-500" /> },
    lost:       { color: 'border-red-500', bgColor: 'bg-red-50 dark:bg-red-900/30', textColor: 'text-red-700 dark:text-red-300', icon: <XCircleIcon size={18} className="text-red-500" /> },
    won:        { color: 'border-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/30', textColor: 'text-purple-700 dark:text-purple-300', icon: <Star size={18} className="text-purple-500" /> },
    default:    { color: 'border-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-800 dark:text-gray-200', icon: <ArrowRightLeft size={18} className="text-gray-500"/>}
};

const getLeadAvatarPlaceholder = (name) => {
    const colors = [
        'bg-red-400', 'bg-green-400', 'bg-blue-400', 'bg-yellow-400', 
        'bg-purple-400', 'bg-indigo-400', 'bg-pink-400', 'bg-teal-400',
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


export default function KanbanLeads({ user, leads: initialLeads = [] }) {
    const { props } = usePage();
  
    const flash = props.flash || {};
    
    const [leads, setLeads] = useState(initialLeads);
    const [draggedLead, setDraggedLead] = useState(null);

    useEffect(() => {
        setLeads(initialLeads);
    }, [initialLeads]);


    const onDragStart = (e, lead) => {
        setDraggedLead(lead);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", lead.id); 
    };
    const onDragEnd = () => {
        setDraggedLead(null);
    };

    const onDrop = (targetStatus) => {
        if (draggedLead && draggedLead.status !== targetStatus) {
            const originalLeads = [...leads];
            const updatedLeads = leads.map(l => 
                l.id === draggedLead.id ? { ...l, status: targetStatus } : l
            );
            setLeads(updatedLeads);

            router.put(route('leads.updateStatus', draggedLead.id), { status: targetStatus }, {
                preserveScroll: true,
                replace: true, 
                onSuccess: () => {
                    // Success: Inertia should provide the latest leads prop, which updates the state via useEffect
                },
                onError: (errors) => {
                    console.error("Error updating lead status:", errors);
                    setLeads(originalLeads); 
                },
                onFinish: () => {
                    setDraggedLead(null);
                },
            });
        } else {
            setDraggedLead(null);
        }
    };
    
    const [dragOverStatus, setDragOverStatus] = useState(null);

    return (
        <AuthenticatedLayout user={user} title="Leads Kanban">
            <Head title="Leads Kanban" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-full mx-auto">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100">Leads Kanban Board</h1>
                    <div className="flex items-center gap-3">
                        <Link 
                            href={route('leads.index')} 
                            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors"
                        >
                            List View
                        </Link>
                        <Link
                            href={route('leads.create')}
                            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm font-medium"
                        >
                            <Plus size={18} className="mr-2 -ml-1" />
                            Add Lead
                        </Link>
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
                        <XCircleIcon size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.error}</span>
                    </div>
                )}

                <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4">
                    {statusColumns.map((col) => {
                        const meta = statusMeta[col.key] || statusMeta.default;
                        const leadsInColumn = leads.filter(l => l.status === col.key);
                        return (
                            <div
                                key={col.key}
                                className={`flex-shrink-0 w-80 min-h-[calc(100vh-200px)] bg-gray-100 dark:bg-gray-800/70 rounded-xl shadow-lg flex flex-col border-t-4 ${meta.color} ${dragOverStatus === col.key ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                                onDragOver={(e) => { e.preventDefault(); setDragOverStatus(col.key); e.dataTransfer.dropEffect = "move";}}
                                onDragLeave={() => setDragOverStatus(null)}
                                onDrop={() => { onDrop(col.key); setDragOverStatus(null); }}
                            >
                                <div className={`flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700/60 sticky top-0 ${meta.bgColor} rounded-t-xl z-10`}>
                                    <span className={`p-1.5 rounded-full ${meta.bgColor === 'bg-gray-100 dark:bg-gray-700/30' ? meta.textColor.replace('text-', 'bg-') : meta.color.replace('border-', 'bg-')} text-white shadow`}>{meta.icon}</span>
                                    <h2 className={`font-semibold text-lg ${meta.textColor}`}>{col.label}</h2>
                                    <span className={`ml-auto text-sm font-medium px-2 py-0.5 rounded-full ${meta.bgColor} ${meta.textColor}`}>{leadsInColumn.length}</span>
                                </div>
                                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                                    {leadsInColumn.length === 0 && (
                                        <div className="text-center text-gray-400 dark:text-gray-500 py-10 italic opacity-80 select-none">
                                            No leads in this stage.
                                        </div>
                                    )}
                                    {leadsInColumn.map(lead => {
                                        const avatar = getLeadAvatarPlaceholder(lead.name);
                                        return (
                                        <div
                                            key={lead.id}
                                            className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 cursor-grab transition-all duration-150 hover:shadow-xl hover:-translate-y-0.5 relative group 
                                                        ${draggedLead?.id === lead.id ? 'opacity-50 ring-2 ring-blue-500 dark:ring-blue-400 scale-95' : ''}`}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, lead)}
                                            onDragEnd={onDragEnd}
                                        >
                                            <div className="flex items-start gap-3 mb-2.5">
                                                <div className={`w-10 h-10 ${avatar.colorClass} rounded-lg flex items-center justify-center font-semibold text-lg uppercase flex-shrink-0 shadow`}>
                                                    {avatar.initials}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <Link href={route('leads.show', lead.id)} className="font-semibold text-gray-800 dark:text-gray-100 text-base hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block" title={lead.name}>
                                                        {lead.name}
                                                    </Link>
                                                    {lead.company && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center" title={lead.company}>
                                                           <Building2 size={12} className="mr-1 flex-shrink-0" /> {lead.company}
                                                        </p>
                                                    )}
                                                </div>
                                                <GripVertical size={18} className="text-gray-300 dark:text-gray-600 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            
                                            {lead.email && (
                                                <a href={`mailto:${lead.email}`} className="text-xs text-blue-500 dark:text-blue-400 hover:underline truncate flex items-center my-1.5" title={lead.email} onClick={(e) => e.stopPropagation()}>
                                                    <Mail size={12} className="mr-1.5 flex-shrink-0" /> {lead.email}
                                                </a>
                                            )}

                                            <div className="flex flex-wrap gap-1.5 my-2.5">
                                                {lead.tags && Array.isArray(lead.tags) && lead.tags.slice(0,2).map((tag, idx) => {
                                                    const tagName = typeof tag === 'string' ? tag : (tag && tag.name);
                                                    return (
                                                        <span key={idx} className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200 rounded-full px-2 py-0.5 text-[10px] font-medium">
                                                            {tagName || ''}
                                                        </span>
                                                    );
                                                })}
                                                {lead.tags && Array.isArray(lead.tags) && lead.tags.length > 2 && (
                                                    <Tippy content={
                                                        lead.tags.slice(2).map(tag => typeof tag === 'string' ? tag : (tag && tag.name) || '').filter(Boolean).join(', ')
                                                    }>
                                                        <span className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 text-[10px] font-medium">
                                                            +{lead.tags.length - 2} more
                                                        </span>
                                                    </Tippy>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                                                <div className="flex items-center gap-1" title={`Score: ${lead.score || 'N/A'}`}>
                                                    <Star size={12} className={lead.score && lead.score > 0 ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"} /> 
                                                    <span>{lead.score || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-1" title={`Added: ${new Date(lead.created_at).toLocaleDateString()}`}>
                                                    <Calendar size={12} /> 
                                                    <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <Tippy content="View"><Link href={route('leads.show', lead.id)} className="p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><Eye size={14}/></Link></Tippy>
                                                <Tippy content="Edit"><Link href={route('leads.edit', lead.id)} className="p-1.5 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><Edit2 size={14}/></Link></Tippy>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </AuthenticatedLayout>
    
    );
}
