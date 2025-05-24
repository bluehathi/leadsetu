import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/parts/Sidebar';

const statusColumns = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'unqualified', label: 'Unqualified' },
  { key: 'lost', label: 'Lost' },
  { key: 'won', label: 'Won' },
];

export default function KanbanLeads({ leads = [], user }) {
  const [draggedLead, setDraggedLead] = useState(null);
  const { flash } = usePage().props;

  const onDragStart = (lead) => setDraggedLead(lead);
  const onDragEnd = () => setDraggedLead(null);

  // Placeholder for backend update
  const onDrop = (status) => {
    // TODO: Send status update to backend
    setDraggedLead(null);
  };

  return (
    <>
      <Head title="Leads Kanban" />
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
        <Sidebar user={user} />
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
              <div className="flex gap-4 overflow-x-auto">
                {statusColumns.map((col) => (
                  <div
                    key={col.key}
                    className="flex-1 min-w-[260px] bg-white dark:bg-gray-800 rounded-lg shadow p-3 flex flex-col"
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => draggedLead && onDrop(col.key)}
                  >
                    <div className="font-semibold text-gray-700 dark:text-gray-200 mb-2 border-b pb-1">{col.label}</div>
                    <div className="flex-1 space-y-3 min-h-[60px]">
                      {leads.filter(l => l.status === col.key).map(lead => (
                        <div
                          key={lead.id}
                          className={`rounded bg-blue-50 dark:bg-blue-900 p-3 shadow cursor-move border border-blue-200 dark:border-blue-700 transition hover:bg-blue-100 dark:hover:bg-blue-800`}
                          draggable
                          onDragStart={() => onDragStart(lead)}
                          onDragEnd={onDragEnd}
                        >
                          <div className="font-bold text-blue-900 dark:text-blue-100 text-sm">{lead.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">{lead.company?.name || lead.company || '-'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{lead.email}</div>
                          <div className="flex gap-2 mt-2">
                            <Link href={route('leads.show', lead.id)} className="text-xs text-blue-600 hover:underline">View</Link>
                            <Link href={route('leads.edit', lead.id)} className="text-xs text-indigo-600 hover:underline">Edit</Link>
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
    </>
  );
}
