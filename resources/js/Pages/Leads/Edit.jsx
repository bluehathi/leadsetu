import React, { useState, useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Sidebar from '@/Components/parts/Sidebar';
import { Mail, Phone, Building2, Globe, ArrowLeft, Save, BadgeInfo, Briefcase, Tag, StickyNote, Share2, CircleDot, X } from 'lucide-react';

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
        title: lead.title || '',
        positions: lead.positions || '',
        tags: Array.isArray(lead.tags) ? lead.tags : (lead.tags ? JSON.parse(lead.tags) : []),
        deal_value: lead.deal_value || '',
        expected_close: lead.expected_close || '',
        lead_score: lead.lead_score || '',
        lead_owner: lead.lead_owner || '',
        priority: lead.priority || 'Medium',
        attachments: Array.isArray(lead.attachments) ? lead.attachments : (lead.attachments ? JSON.parse(lead.attachments) : []),
    });
    const tagInputRef = useRef();
    const [tagInput, setTagInput] = useState('');

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
                                {/* Lead Profile */}
                                <div className="mb-0 pb-6 border-b border-gray-200 dark:border-gray-700 mt-8">
                                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        Lead Profile
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"><BadgeInfo size={16}/> Title</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 px-3 py-2 dark:text-white"
                                                value={data.title}
                                                onChange={e => setData('title', e.target.value)}
                                            />
                                            {errors.title && <div className="text-red-500 text-xs mt-1">{errors.title}</div>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"><Briefcase size={16}/> Positions</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 px-3 py-2 dark:text-white"
                                                value={data.positions}
                                                onChange={e => setData('positions', e.target.value)}
                                                placeholder="e.g. CEO, Founder"
                                            />
                                            {errors.positions && <div className="text-red-500 text-xs mt-1">{errors.positions}</div>}
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"><Tag size={16}/> Tags</label>
                                        <div className="flex flex-wrap gap-2 mt-1 mb-2">
                                            {data.tags.map((tag, idx) => (
                                                <span key={idx} className="inline-flex items-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                                                    {tag}
                                                    <button type="button" className="ml-1 focus:outline-none" onClick={() => setData('tags', data.tags.filter((_, i) => i !== idx))}>
                                                        <X size={14} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <input
                                            ref={tagInputRef}
                                            type="text"
                                            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 px-3 py-2 dark:text-white"
                                            value={tagInput}
                                            onChange={e => setTagInput(e.target.value)}
                                            onKeyDown={e => {
                                                if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                                                    e.preventDefault();
                                                    if (!data.tags.includes(tagInput.trim())) {
                                                        setData('tags', [...data.tags, tagInput.trim()]);
                                                    }
                                                    setTagInput('');
                                                } else if (e.key === 'Backspace' && !tagInput && data.tags.length) {
                                                    setData('tags', data.tags.slice(0, -1));
                                                }
                                            }}
                                            placeholder="Type and press Enter or comma..."
                                        />
                                        {errors.tags && <div className="text-red-500 text-xs mt-1">{errors.tags}</div>}
                                    </div>
                                </div>
                                {/* Lead Details - Extra Fields */}
                                <div className="mb-0 pb-6 border-b border-gray-200 dark:border-gray-700 mt-8">
                                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">Additional Details</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deal Value</label>
                                            <input
                                                type="number"
                                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2"
                                                value={data.deal_value}
                                                onChange={e => setData('deal_value', e.target.value)}
                                            />
                                            {errors.deal_value && <div className="text-red-500 text-xs mt-1">{errors.deal_value}</div>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expected Close</label>
                                            <input
                                                type="date"
                                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2"
                                                value={data.expected_close}
                                                onChange={e => setData('expected_close', e.target.value)}
                                            />
                                            {errors.expected_close && <div className="text-red-500 text-xs mt-1">{errors.expected_close}</div>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lead Score</label>
                                            <input
                                                type="number"
                                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2"
                                                value={data.lead_score}
                                                onChange={e => setData('lead_score', e.target.value)}
                                            />
                                            {errors.lead_score && <div className="text-red-500 text-xs mt-1">{errors.lead_score}</div>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lead Owner</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2"
                                                value={data.lead_owner}
                                                onChange={e => setData('lead_owner', e.target.value)}
                                            />
                                            {errors.lead_owner && <div className="text-red-500 text-xs mt-1">{errors.lead_owner}</div>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                                            <select className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2" value={data.priority} onChange={e => setData('priority', e.target.value)}>
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                            </select>
                                            {errors.priority && <div className="text-red-500 text-xs mt-1">{errors.priority}</div>}
                                        </div>
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