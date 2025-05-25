import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Mail, Phone, Globe, ArrowLeft, Save, BadgeInfo, Briefcase, Tag, StickyNote, Share2, CircleDot, X, PlusCircle, User2, Users2, BriefcaseBusiness, Contact2, Building2 } from 'lucide-react';

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

export default function LeadEdit({ user, lead, companies = [], contacts = [] }) {
    const [tab, setTab] = useState('lead');
    const [showNewCompany, setShowNewCompany] = useState(false);
    const [showNewContact, setShowNewContact] = useState(false);
    const { data, setData, put, processing, errors } = useForm({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company_id: lead.company_id || '',
        company_name: '',
        company_website: '',
        contact_id: lead.contact_id || '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        status: lead.status || 'new',
        source: lead.source || 'website',
        notes: lead.notes || '',
        deal_value: lead.deal_value || '',
        expected_close: lead.expected_close || '',
        lead_score: lead.lead_score || '',
        lead_owner: lead.lead_owner || '',
        priority: lead.priority || 'Medium',
        title: lead.title || '',
        positions: lead.positions || '',
        tags: Array.isArray(lead.tags) ? lead.tags.join(', ') : (lead.tags || ''),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('leads.update', lead.id));
    };

    return (
        <AuthenticatedLayout user={user} title={`Edit Lead: ${lead.name}`}>
            <div className="py-8 px-4 sm:px-6 lg:px-8 mx-auto w-full">
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <PlusCircle className="text-blue-500" size={28} /> Edit Lead
                    </h1>
                    <Link href={route('leads.index')} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition">Back</Link>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
                    <nav className="mb-8 flex space-x-8 border-b border-gray-200 dark:border-gray-700">
                        <button type="button" className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${tab === 'lead' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-gray-400'}`} onClick={() => setTab('lead')}><User2 className="mr-2 inline-block" /> Lead</button>
                        <button type="button" className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${tab === 'company' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-gray-400'}`} onClick={() => setTab('company')}><BriefcaseBusiness className="mr-2 inline-block" /> Company</button>
                        <button type="button" className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${tab === 'contact' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-gray-400'}`} onClick={() => setTab('contact')}><Contact2 className="mr-2 inline-block" /> Contact</button>
                    </nav>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Lead Tab */}
                        {tab === 'lead' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Lead Name</label>
                                    <input type="text" className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.name} onChange={e => setData('name', e.target.value)} required />
                                    {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                                    <input type="email" className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.email} onChange={e => setData('email', e.target.value)} />
                                    {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</label>
                                    <input type="text" className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.phone} onChange={e => setData('phone', e.target.value)} />
                                    {errors.phone && <div className="text-red-500 text-xs mt-1">{errors.phone}</div>}
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Title</label>
                                    <input type="text" className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.title} onChange={e => setData('title', e.target.value)} />
                                    {errors.title && <div className="text-red-500 text-xs mt-1">{errors.title}</div>}
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Positions</label>
                                    <input type="text" className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.positions} onChange={e => setData('positions', e.target.value)} />
                                    {errors.positions && <div className="text-red-500 text-xs mt-1">{errors.positions}</div>}
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Tags (comma separated)</label>
                                    <input type="text" className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.tags} onChange={e => setData('tags', e.target.value)} />
                                    {errors.tags && <div className="text-red-500 text-xs mt-1">{errors.tags}</div>}
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</label>
                                    <select className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.status} onChange={e => setData('status', e.target.value)}>
                                        {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    {errors.status && <div className="text-red-500 text-xs mt-1">{errors.status}</div>}
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Source</label>
                                    <select className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.source} onChange={e => setData('source', e.target.value)}>
                                        {sourceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    {errors.source && <div className="text-red-500 text-xs mt-1">{errors.source}</div>}
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Deal Value</label>
                                    <input type="number" className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.deal_value} onChange={e => setData('deal_value', e.target.value)} min="0" />
                                    {errors.deal_value && <div className="text-red-500 text-xs mt-1">{errors.deal_value}</div>}
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Expected Close Date</label>
                                    <input type="date" className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.expected_close} onChange={e => setData('expected_close', e.target.value)} />
                                    {errors.expected_close && <div className="text-red-500 text-xs mt-1">{errors.expected_close}</div>}
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Lead Score</label>
                                    <input type="number" className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.lead_score} onChange={e => setData('lead_score', e.target.value)} min="0" max="100" />
                                    {errors.lead_score && <div className="text-red-500 text-xs mt-1">{errors.lead_score}</div>}
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Lead Owner</label>
                                    <input type="text" className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.lead_owner} onChange={e => setData('lead_owner', e.target.value)} />
                                    {errors.lead_owner && <div className="text-red-500 text-xs mt-1">{errors.lead_owner}</div>}
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Priority</label>
                                    <select className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.priority} onChange={e => setData('priority', e.target.value)}>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                    {errors.priority && <div className="text-red-500 text-xs mt-1">{errors.priority}</div>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</label>
                                    <textarea className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-h-[80px]" value={data.notes} onChange={e => setData('notes', e.target.value)} />
                                    {errors.notes && <div className="text-red-500 text-xs mt-1">{errors.notes}</div>}
                                </div>
                            </div>
                        )}
                        {/* Company Tab */}
                        {tab === 'company' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Select Existing Company</label>
                                    <select className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.company_id} onChange={e => setData('company_id', e.target.value)}>
                                        <option value="">Select a company</option>
                                        {companies.map(company => (
                                            <option key={company.id} value={company.id}>{company.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center my-2">
                                    <span className="text-xs text-gray-500 mr-2">or</span>
                                    <button type="button" className="text-blue-600 underline text-xs" onClick={() => setShowNewCompany(v => !v)}>{showNewCompany ? 'Cancel' : 'Add New Company'}</button>
                                </div>
                                {showNewCompany && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Company Name</label>
                                            <input type="text" className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.company_name} onChange={e => setData('company_name', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Website</label>
                                            <input type="text" className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.company_website} onChange={e => setData('company_website', e.target.value)} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Contact Tab */}
                        {tab === 'contact' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Select Existing Contact</label>
                                    <select className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.contact_id} onChange={e => setData('contact_id', e.target.value)}>
                                        <option value="">Select a contact</option>
                                        {contacts.map(contact => (
                                            <option key={contact.id} value={contact.id}>{contact.name} ({contact.email})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center my-2">
                                    <span className="text-xs text-gray-500 mr-2">or</span>
                                    <button type="button" className="text-blue-600 underline text-xs" onClick={() => setShowNewContact(v => !v)}>{showNewContact ? 'Cancel' : 'Add New Contact'}</button>
                                </div>
                                {showNewContact && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Name</label>
                                            <input type="text" className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.contact_name} onChange={e => setData('contact_name', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                                            <input type="email" className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.contact_email} onChange={e => setData('contact_email', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</label>
                                            <input type="text" className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={data.contact_phone} onChange={e => setData('contact_phone', e.target.value)} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex justify-end space-x-2 mt-8">
                            <Link href={route('leads.index')} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</Link>
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition font-semibold text-base" disabled={processing}>{processing ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}