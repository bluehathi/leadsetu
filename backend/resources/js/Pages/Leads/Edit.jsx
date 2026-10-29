import React, { useState, useEffect } from 'react'; // Added useEffect
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    CheckCircle2, XCircle, User, Mail as MailIcon, Phone as PhoneIcon, Briefcase as BriefcaseIcon, 
    Globe, DollarSign, CalendarDays, Star, AlignLeft, Building, Save, ArrowLeft, Tag,
    TrendingUp, Users2, Info, Edit3,PlusCircle // Added Edit3 for consistency
} from 'lucide-react';
import axios from 'axios';

const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'unqualified', label: 'Unqualified' },
    { value: 'lost', label: 'Lost Deal' },
    { value: 'won', label: 'Won Deal' },
];
const sourceOptions = [
    { value: 'website', label: 'Website Form' },
    { value: 'referral', label: 'Referral' },
    { value: 'cold_call', label: 'Cold Call' },
    { value: 'advertisement', label: 'Advertisement' },
    { value: 'other', label: 'Other' },
];
const priorityOptions = [
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
];

export default function LeadEdit({ user, lead, companies: initialCompanies = [], contacts: initialContacts = [] }) {
    const { props } = usePage();
  
    const flash = props.flash || {};

    const companies = Array.isArray(initialCompanies) ? initialCompanies : [];
    const contacts = Array.isArray(initialContacts) ? initialContacts : [];
    
    const [tab, setTab] = useState('lead');

    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company_id: lead.company_id || '',
        company_name: '', // For new company
        company_website: '', // For new company
        contact_id: lead.contact_id || '',
        contact_name: '', // For new contact
        contact_email: '', // For new contact
        contact_phone: '', // For new contact
        status: lead.status || 'new',
        source: lead.source || 'website',
        notes: lead.notes || '',
        deal_value: lead.deal_value || '',
        expected_close: lead.expected_close || '',
        lead_score: lead.lead_score || '',
        lead_owner: lead.lead_owner || (user ? String(user.id) : ''),
        priority: lead.priority || 'Medium',
        title: lead.title || '',
        positions: lead.positions || '',
        tags: Array.isArray(lead.tags) ? lead.tags.join(', ') : (lead.tags || ''),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const tagsArray = data.tags.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '');
        
        put(route('leads.update', lead.id), {
            data: { ...data, tags: tagsArray },
            preserveScroll: true,
        });
    };
    
    const commonInputClasses = "block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md";
    const commonLabelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center";
    const commonSelectClasses = `${commonInputClasses} appearance-none`;

    return (
        <AuthenticatedLayout user={user} title={`Edit Lead: ${lead.name}`}>
            <Head title={`Edit ${lead.name}`} />
            <div className="py-8 px-4 sm:px-6 lg:px-8 w-full mx-auto">

               
                {flash.success && (
                    <div className="mb-5 p-4 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-200 flex items-center shadow" role="alert">
                        <CheckCircle2 size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && Object.keys(flash.error).length > 0 && (
                    <div className="mb-5 p-4 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-200 flex items-center shadow" role="alert">
                        <XCircle size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.error || 'An unexpected error occurred. Please check the form for details.'}</span>
                    </div>
                )}
                 {errors && Object.keys(errors).length > 0 && (
                    <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 rounded-lg text-sm" role="alert">
                        <p className="font-medium mb-1">Please correct the following errors:</p>
                        <ul className="list-disc list-inside">
                            {Object.entries(errors).map(([field, message]) => message ? <li key={field}>{message}</li> : null)}
                        </ul>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8">
                    <nav className="mb-8 flex space-x-1 sm:space-x-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                        {[
                            { key: 'lead', label: 'Lead Details', icon: Info },
                            { key: 'company', label: 'Company Info', icon: Building },
                            { key: 'contact', label: 'Primary Contact', icon: Users2 } // Changed to Users2
                        ].map(item => (
                            <button 
                                key={item.key}
                                type="button" 
                                className={`flex items-center gap-2 whitespace-nowrap pb-3 pt-1 px-3 border-b-2 font-medium text-sm sm:text-base transition-colors duration-150
                                            ${tab === item.key 
                                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                onClick={() => setTab(item.key)}
                            >
                                <item.icon size={18} className={tab === item.key ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'} />
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {tab === 'lead' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className={commonLabelClasses}>Lead Name <span className="text-red-500 ml-1">*</span></label>
                                        <input type="text" id="name" className={commonInputClasses} value={data.name} onChange={e => setData('name', e.target.value)} required placeholder="e.g., Project Alpha Inquiry"/>
                                        {errors.name && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.name}</div>}
                                    </div>
                                    <div>
                                        <label htmlFor="title" className={commonLabelClasses}><BriefcaseIcon size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Job Title / Position</label>
                                        <input type="text" id="title" className={commonInputClasses} value={data.title} onChange={e => setData('title', e.target.value)} placeholder="e.g., Project Manager"/>
                                        {errors.title && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.title}</div>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="email" className={commonLabelClasses}><MailIcon size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Email Address</label>
                                        <input type="email" id="email" className={commonInputClasses + ' bg-gray-100 dark:bg-gray-700 cursor-not-allowed'} value={data.email} readOnly tabIndex={-1} aria-readonly="true" style={{ pointerEvents: 'none' }} placeholder="e.g., lead@example.com"/>
                                        <div className="text-xs text-gray-500 mt-1">This field cannot be edited.</div>
                                    </div>
                                    <div>
                                        <label htmlFor="phone" className={commonLabelClasses}><PhoneIcon size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Phone Number</label>
                                        <input type="text" id="phone" className={commonInputClasses + ' bg-gray-100 dark:bg-gray-700 cursor-not-allowed'} value={data.phone} readOnly tabIndex={-1} aria-readonly="true" style={{ pointerEvents: 'none' }} placeholder="e.g., (123) 456-7890"/>
                                        <div className="text-xs text-gray-500 mt-1">This field cannot be edited.</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="status" className={commonLabelClasses}>Status</label>
                                        <select id="status" className={commonSelectClasses} value={data.status} onChange={e => setData('status', e.target.value)}>
                                            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        {errors.status && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.status}</div>}
                                    </div>
                                    <div>
                                        <label htmlFor="source" className={commonLabelClasses}>Source</label>
                                        <select id="source" className={commonSelectClasses} value={data.source} onChange={e => setData('source', e.target.value)}>
                                            {sourceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        {errors.source && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.source}</div>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                        <label htmlFor="priority" className={commonLabelClasses}>Priority</label>
                                        <select id="priority" className={commonSelectClasses} value={data.priority} onChange={e => setData('priority', e.target.value)}>
                                            {priorityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        {errors.priority && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.priority}</div>}
                                    </div>
                                    <div>
                                        <label htmlFor="lead_owner" className={commonLabelClasses}><User size={16} className="mr-2 text-gray-400 dark:text-gray-500" />Lead Owner</label>
                                        <select
                                            id="lead_owner"
                                            className={commonSelectClasses}
                                            value={data.lead_owner}
                                            onChange={e => setData('lead_owner', e.target.value)}
                                        >
                                            {(!data.lead_owner || data.lead_owner === '') && (
                                                <option value="">-- Select Lead Owner --</option>
                                            )}
                                            {(props.users || user ? [user] : []).map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} ({u.email}){user && String(u.id) === String(user.id) ? ' (You)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.lead_owner && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.lead_owner}</div>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="deal_value" className={commonLabelClasses}><DollarSign size={16} className="mr-2 text-gray-400 dark:text-gray-500" />Deal Value (Optional)</label>
                                        <input type="number" id="deal_value" className={commonInputClasses} value={data.deal_value} onChange={e => setData('deal_value', e.target.value)} min="0" placeholder="e.g., 5000"/>
                                        {errors.deal_value && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.deal_value}</div>}
                                    </div>
                                    <div>
                                        <label htmlFor="expected_close" className={commonLabelClasses}><CalendarDays size={16} className="mr-2 text-gray-400 dark:text-gray-500" />Expected Close Date (Optional)</label>
                                        <input type="date" id="expected_close" className={commonInputClasses} value={data.expected_close} onChange={e => setData('expected_close', e.target.value)} />
                                        {errors.expected_close && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.expected_close}</div>}
                                    </div>
                                </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="lead_score" className={commonLabelClasses}><Star size={16} className="mr-2 text-gray-400 dark:text-gray-500" />Lead Score (Optional)</label>
                                        <input type="number" id="lead_score" className={commonInputClasses} value={data.lead_score} onChange={e => setData('lead_score', e.target.value)} min="0" max="100" placeholder="0-100"/>
                                        {errors.lead_score && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.lead_score}</div>}
                                    </div>
                                     <div>
                                        <label htmlFor="tags" className={commonLabelClasses}><Tag size={16} className="mr-2 text-gray-400 dark:text-gray-500" />Tags (comma-separated)</label>
                                        <input type="text" id="tags" className={commonInputClasses} value={data.tags} onChange={e => setData('tags', e.target.value)} placeholder="e.g., important, follow-up, demo-requested"/>
                                        {errors.tags && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.tags}</div>}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="notes" className={commonLabelClasses}><AlignLeft size={16} className="mr-2 text-gray-400 dark:text-gray-500" />Notes (Optional)</label>
                                    <textarea id="notes" rows="4" className={commonInputClasses} value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Add any relevant notes about this lead..."></textarea>
                                    {errors.notes && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.notes}</div>}
                                </div>
                            </div>
                        )}

                        {tab === 'company' && (
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="company_id" className={commonLabelClasses}><Building size={16} className="mr-2 text-gray-400 dark:text-gray-500" />Company</label>
                                    <input
                                        type="text"
                                        id="company_id"
                                        className={commonInputClasses + ' bg-gray-100 dark:bg-gray-700 cursor-not-allowed'}
                                        value={(() => {
                                            const c = companies.find(c => String(c.id) === String(data.company_id));
                                            return c ? c.name : '';
                                        })()}
                                        readOnly
                                        tabIndex={-1}
                                        aria-readonly="true"
                                        style={{ pointerEvents: 'none' }}
                                    />
                                    <div className="text-xs text-gray-500 mt-1">This field cannot be edited.</div>
                                </div>
                            </div>
                        )}

                        {tab === 'contact' && (
                             <div className="space-y-6">
                                <div>
                                    <label htmlFor="contact_id" className={commonLabelClasses}><Users2 size={16} className="mr-2 text-gray-400 dark:text-gray-500" />Primary Contact</label>
                                    <input
                                        type="text"
                                        id="contact_id"
                                        className={commonInputClasses + ' bg-gray-100 dark:bg-gray-700 cursor-not-allowed'}
                                        value={(() => {
                                            const c = contacts.find(c => String(c.id) === String(data.contact_id));
                                            return c ? `${c.name}${c.email ? ' (' + c.email + ')' : ''}` : '';
                                        })()}
                                        readOnly
                                        tabIndex={-1}
                                        aria-readonly="true"
                                        style={{ pointerEvents: 'none' }}
                                    />
                                    <div className="text-xs text-gray-500 mt-1">This field cannot be edited.</div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-row justify-end items-center space-x-3 pt-8 border-t border-gray-200 dark:border-gray-700 mt-8">
                            <Link 
                                href={route('leads.index')} 
                                className="flex-1 sm:flex-none sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-all duration-150 shadow-sm hover:shadow-md"
                            >
                                <XCircle size={18} className="mr-2" />
                                Cancel
                            </Link>
                            <button 
                                type="submit" 
                                className="flex-1 sm:flex-none sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 text-sm font-medium" 
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} className="mr-2" />
                                        Update Lead
                                    </>
                                )}
                            </button>
                        </div>
                        {recentlySuccessful && (
                            <div className="mt-4 p-3 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-md text-sm text-green-700 dark:text-green-200">
                                Lead updated successfully!
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
