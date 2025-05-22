import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Sidebar from '@/Components/parts/Sidebar';
import { Mail, Phone, Building2, Globe, ArrowLeft, Save } from 'lucide-react';

const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'unqualified', label: 'Unqualified' },
    { value: 'lost', label: 'Lost' },
    { value: 'won', label: 'Won' },
];
const sourceOptions = [
    { value: 'website', label: 'Website Form' },
    { value: 'referral', label: 'Referral' },
    { value: 'cold_call', label: 'Cold Call' },
    { value: 'advertisement', label: 'Advertisement' },
    { value: 'other', label: 'Other' },
];

export default function LeadEdit({ user, lead }) {
    const { data, setData, put, processing, errors } = useForm({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        website: lead.website || '',
        notes: lead.notes || '',
        status: lead.status || 'new',
        source: lead.source || 'website',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('leads.update', lead.id));
    };

    return (
        <>
            <Head title={`Edit Lead: ${lead.name}`} />
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
                <Sidebar user={user} />
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    <main className="flex-1 relative overflow-y-auto focus:outline-none">
                        <div className="py-8 px-2 sm:px-4 lg:px-8 w-full">
                            <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-6">
                                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Lead</h1>
                                    <Link href={route('leads.show', lead.id)} className="inline-flex items-center px-3 py-2 bg-gray-200 text-gray-800 rounded-md text-xs font-semibold hover:bg-gray-300 transition">
                                        <ArrowLeft size={16} className="mr-1" /> Cancel
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Name</label>
                                        <input type="text" className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2" value={data.name} onChange={e => setData('name', e.target.value)} />
                                        {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1"><Mail size={14}/> Email</label>
                                        <input type="email" className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2" value={data.email} onChange={e => setData('email', e.target.value)} />
                                        {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1"><Phone size={14}/> Phone</label>
                                        <input type="text" className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2" value={data.phone} onChange={e => setData('phone', e.target.value)} />
                                        {errors.phone && <div className="text-xs text-red-500 mt-1">{errors.phone}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1"><Building2 size={14}/> Company</label>
                                        <input type="text" className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2" value={data.company} onChange={e => setData('company', e.target.value)} />
                                        {errors.company && <div className="text-xs text-red-500 mt-1">{errors.company}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1"><Globe size={14}/> Website</label>
                                        <input type="text" className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2" value={data.website} onChange={e => setData('website', e.target.value)} />
                                        {errors.website && <div className="text-xs text-red-500 mt-1">{errors.website}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Status</label>
                                        <select className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2" value={data.status} onChange={e => setData('status', e.target.value)}>
                                            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        {errors.status && <div className="text-xs text-red-500 mt-1">{errors.status}</div>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Source</label>
                                        <select className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2" value={data.source} onChange={e => setData('source', e.target.value)}>
                                            {sourceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        {errors.source && <div className="text-xs text-red-500 mt-1">{errors.source}</div>}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Notes</label>
                                    <textarea className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2 min-h-[80px]" value={data.notes} onChange={e => setData('notes', e.target.value)} />
                                    {errors.notes && <div className="text-xs text-red-500 mt-1">{errors.notes}</div>}
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button type="submit" disabled={processing} className="inline-flex items-center px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition shadow disabled:opacity-60">
                                        <Save size={16} className="mr-2" /> Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
} 