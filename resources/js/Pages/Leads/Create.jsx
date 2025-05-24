import React, { useState } from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/parts/Sidebar';

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

export default function LeadCreate({ companies = [], contacts = [], user }) {
    const [tab, setTab] = useState('lead');
    const [showNewCompany, setShowNewCompany] = useState(false);
    const [showNewContact, setShowNewContact] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        company_id: '',
        company_name: '',
        company_website: '',
        contact_id: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        status: 'new',
        source: 'website',
        notes: '',
        deal_value: '',
        expected_close: '',
        lead_score: '',
        lead_owner: '',
        priority: 'Medium',
        title: '',
        positions: '',
        tags: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('leads.store'));
    };

    return (
        <>
            <Head title="Add Lead" />
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
                <Sidebar user={user} />
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    <main className="flex-1 relative overflow-y-auto focus:outline-none">
                        <div className="py-8 px-4 sm:px-6 lg:px-8 mx-auto w-full">
                            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Add Lead</h1>
                                <Link href={route('leads.index')} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">Back</Link>
                            </div>
                            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                                <nav className="-mb-px flex space-x-8">
                                    <button type="button" className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tab === 'lead' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-gray-400'}`} onClick={() => setTab('lead')}>Lead</button>
                                    <button type="button" className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tab === 'company' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-gray-400'}`} onClick={() => setTab('company')}>Company</button>
                                    <button type="button" className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tab === 'contact' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-gray-400'}`} onClick={() => setTab('contact')}>Contact</button>
                                </nav>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                                {tab === 'lead' && (
                                    <>
                                        <div className="mb-4">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Lead Name</label>
                                            <input type="text" className="w-full border px-3 py-2 rounded" value={data.name} onChange={e => setData('name', e.target.value)} required />
                                            {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                                        </div>
                                        <div className="mb-4">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                                            <input type="text" className="w-full border px-3 py-2 rounded" value={data.title} onChange={e => setData('title', e.target.value)} />
                                            {errors.title && <div className="text-red-500 text-xs mt-1">{errors.title}</div>}
                                        </div>
                                        <div className="mb-4">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Positions</label>
                                            <input type="text" className="w-full border px-3 py-2 rounded" value={data.positions} onChange={e => setData('positions', e.target.value)} />
                                            {errors.positions && <div className="text-red-500 text-xs mt-1">{errors.positions}</div>}
                                        </div>
                                        <div className="mb-4">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Tags (comma separated)</label>
                                            <input type="text" className="w-full border px-3 py-2 rounded" value={data.tags} onChange={e => setData('tags', e.target.value)} />
                                            {errors.tags && <div className="text-red-500 text-xs mt-1">{errors.tags}</div>}
                                        </div>
                                        <div className="mb-4">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                            <select className="w-full border px-3 py-2 rounded" value={data.status} onChange={e => setData('status', e.target.value)}>
                                                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                            {errors.status && <div className="text-red-500 text-xs mt-1">{errors.status}</div>}
                                        </div>
                                        <div className="mb-4">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Source</label>
                                            <select className="w-full border px-3 py-2 rounded" value={data.source} onChange={e => setData('source', e.target.value)}>
                                                {sourceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                            {errors.source && <div className="text-red-500 text-xs mt-1">{errors.source}</div>}
                                        </div>
                                        <div className="mb-4">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Deal Value</label>
                                            <input type="number" className="w-full border px-3 py-2 rounded" value={data.deal_value} onChange={e => setData('deal_value', e.target.value)} min="0" />
                                            {errors.deal_value && <div className="text-red-500 text-xs mt-1">{errors.deal_value}</div>}
                                        </div>
                                        <div className="mb-4">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Expected Close Date</label>
                                            <input type="date" className="w-full border px-3 py-2 rounded" value={data.expected_close} onChange={e => setData('expected_close', e.target.value)} />
                                            {errors.expected_close && <div className="text-red-500 text-xs mt-1">{errors.expected_close}</div>}
                                        </div>
                                        <div className="mb-4">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Lead Score</label>
                                            <input type="number" className="w-full border px-3 py-2 rounded" value={data.lead_score} onChange={e => setData('lead_score', e.target.value)} min="0" max="100" />
                                            {errors.lead_score && <div className="text-red-500 text-xs mt-1">{errors.lead_score}</div>}
                                        </div>
                                        <div className="mb-4">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Lead Owner</label>
                                            <input type="text" className="w-full border px-3 py-2 rounded" value={data.lead_owner} onChange={e => setData('lead_owner', e.target.value)} />
                                            {errors.lead_owner && <div className="text-red-500 text-xs mt-1">{errors.lead_owner}</div>}
                                        </div>
                                        <div className="mb-4">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                                            <select className="w-full border px-3 py-2 rounded" value={data.priority} onChange={e => setData('priority', e.target.value)}>
                                                <option value="High">High</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Low">Low</option>
                                            </select>
                                            {errors.priority && <div className="text-red-500 text-xs mt-1">{errors.priority}</div>}
                                        </div>
                                        <div className="mb-4">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                                            <textarea className="w-full border px-3 py-2 rounded" value={data.notes} onChange={e => setData('notes', e.target.value)} />
                                            {errors.notes && <div className="text-red-500 text-xs mt-1">{errors.notes}</div>}
                                        </div>
                                    </>
                                )}
                                {tab === 'company' && (
                                    <>
                                        <div className="mb-4">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Select Existing Company</label>
                                            <select className="w-full border px-3 py-2 rounded" value={data.company_id} onChange={e => setData('company_id', e.target.value)}>
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
                                            <>
                                                <div className="mb-4">
                                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                                                    <input type="text" className="w-full border px-3 py-2 rounded" value={data.company_name} onChange={e => setData('company_name', e.target.value)} />
                                                </div>
                                                <div className="mb-4">
                                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
                                                    <input type="text" className="w-full border px-3 py-2 rounded" value={data.company_website} onChange={e => setData('company_website', e.target.value)} />
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                                {tab === 'contact' && (
                                    <>
                                        <div className="mb-4">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Select Existing Contact</label>
                                            <select className="w-full border px-3 py-2 rounded" value={data.contact_id} onChange={e => setData('contact_id', e.target.value)}>
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
                                            <>
                                                <div className="mb-4">
                                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Contact Name</label>
                                                    <input type="text" className="w-full border px-3 py-2 rounded" value={data.contact_name} onChange={e => setData('contact_name', e.target.value)} />
                                                </div>
                                                <div className="mb-4">
                                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                                    <input type="email" className="w-full border px-3 py-2 rounded" value={data.contact_email} onChange={e => setData('contact_email', e.target.value)} />
                                                </div>
                                                <div className="mb-4">
                                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                                                    <input type="text" className="w-full border px-3 py-2 rounded" value={data.contact_phone} onChange={e => setData('contact_phone', e.target.value)} />
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                                <div className="flex justify-end space-x-2 mt-6">
                                    <Link href={route('leads.index')} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</Link>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={processing}>{processing ? 'Saving...' : 'Save Lead'}</button>
                                </div>
                            </form>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}