import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import Sidebar from '@/Components/parts/Sidebar';
import { User, Building2, Mail, Tag, Calendar, Star, ArrowRightLeft, PlusCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const statusColumns = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'unqualified', label: 'Unqualified' },
  { key: 'lost', label: 'Lost' },
  { key: 'won', label: 'Won' },
];

const statusMeta = {
  new:    { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: <PlusCircle size={18} /> },
  contacted: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: <Mail size={18} /> },
  qualified: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: <CheckCircle size={18} /> },
  unqualified: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', icon: <XCircle size={18} /> },
  lost:   { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: <ArrowRightLeft size={18} /> },
  won:    { color: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100', icon: <Star size={18} /> },
};

export default function KanbanLeads({ leads = [], user }) {
  const { props } = usePage();

  const [draggedLead, setDraggedLead] = useState(null);
  const { flash } = usePage().props;

  const onDragStart = (lead) => setDraggedLead(lead);
  const onDragEnd = () => setDraggedLead(null);

  // Update onDrop to persist status change
  const onDrop = (status) => {
    if (draggedLead && draggedLead.status !== status) {
      router.put(route('leads.update', draggedLead.id), { ...draggedLead, status }, {
        preserveScroll: true,
        replace: false, // Prevent Inertia from replacing the page
        onSuccess: () => setDraggedLead(null),
        onError: () => setDraggedLead(null),
        onFinish: () => setDraggedLead(null),
        only: undefined, // Remove 'only' to avoid Inertia modal bug
      });
    } else {
      setDraggedLead(null);
    }
  };

  return (
    <>
    <AuthenticatedLayout user={props.auth?.user} title="Leads Kanban">
      <Head title="Leads Kanban" />
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-8 px-4 sm:px-6 lg:px-8 mx-auto w-full">
              <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Leads Kanban</h1>
                <Link href={route('leads.create')} className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700">Add Lead</Link>
              </div>
              {flash?.success && (
                <div className="mb-4 p-4 bg-green-100 border border-green-200 text-green-700 rounded-md">{flash.success}</div>
              )}
              <div className="flex gap-4 overflow-x-auto pb-2">
                {statusColumns.map((col) => (
                  <div
                    key={col.key}
                    className={`flex-1 min-w-[280px] bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-3 flex flex-col border-t-4 ${statusMeta[col.key]?.color || 'border-gray-200'}`}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => draggedLead && onDrop(col.key)}
                    style={{ transition: 'box-shadow 0.2s, border-color 0.2s' }}
                  >
                    <div className={`flex items-center gap-2 font-bold text-lg mb-3 ${statusMeta[col.key]?.color || ''}`}>
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-700">{statusMeta[col.key]?.icon}</span>
                      {col.label}
                    </div>
                    <div className="flex-1 space-y-4 min-h-[60px]">
                      {leads.filter(l => l.status === col.key).length === 0 && (
                        <div className="text-center text-gray-400 dark:text-gray-500 py-8 italic opacity-70 select-none">No leads</div>
                      )}
                      {leads.filter(l => l.status === col.key).map(lead => (
                        <div
                          key={lead.id}
                          className={`rounded-xl bg-white dark:bg-gray-800 p-4 shadow-md border border-gray-100 dark:border-gray-700 cursor-move transition-transform duration-150 hover:scale-[1.03] hover:shadow-xl relative group ${draggedLead?.id === lead.id ? 'ring-2 ring-blue-400' : ''}`}
                          draggable
                          onDragStart={() => onDragStart(lead)}
                          onDragEnd={onDragEnd}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-700 dark:text-blue-200 text-lg uppercase">
                              {lead.name?.[0] || <User size={20} />}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                                {lead.name}
                                {lead.company?.name && (
                                  <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-semibold">{lead.company.name}</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <Mail size={12} className="inline-block" /> {lead.email || '-'}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-1">
                            {lead.tags && Array.isArray(lead.tags) && lead.tags.map((tag, idx) => (
                              <span key={idx} className="inline-block bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-full px-2 py-0.5 text-xs font-semibold">{tag}</span>
                            ))}
                            {lead.score && (
                              <span className="inline-block bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full px-2 py-0.5 text-xs font-semibold">Score: {lead.score}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-1">
                            <Calendar size={12} /> {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}
                            <span className="ml-auto group-hover:opacity-100 opacity-0 transition-opacity flex gap-2">
                              <Link href={route('leads.show', lead.id)} className="text-blue-600 hover:underline mr-2">View</Link>
                              <Link href={route('leads.edit', lead.id)} className="text-indigo-600 hover:underline">Edit</Link>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
      </AuthenticatedLayout>
    </>
  );
}
