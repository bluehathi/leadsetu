import React, { useState } from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    CheckCircle2, XCircle, User, Mail, Phone as PhoneIcon, Briefcase as BriefcaseIcon, 
    Globe, DollarSign, CalendarDays, Star, AlignLeft, Building, Save, ArrowLeft, Tag,
    TrendingUp, Users, Info, PlusCircle // Added icons for tabs and fields
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

export default function LeadCreate({ user, companies: initialCompanies = [], contacts: initialContacts = [], users: initialUsers = [] }) {
    const { props } = usePage();
    
    const flash = props.flash || {};
    
    // Ensure companies and contacts are arrays
    const companies = Array.isArray(initialCompanies) ? initialCompanies : [];
    const contacts = Array.isArray(initialContacts) ? initialContacts : [];
    const users = Array.isArray(initialUsers) ? initialUsers : [];

    const [tab, setTab] = useState('lead'); // 'lead', 'company', 'contact'
    const [showNewCompany, setShowNewCompany] = useState(false);
    const [showNewContact, setShowNewContact] = useState(false);
    const [filteredContacts, setFilteredContacts] = useState([]);

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        name: '',
        email: '',
        phone: '',
        company_id: '',
        company_name: '', // For new company
        company_website: '', // For new company
        contact_id: '',
        contact_name: '', // For new contact
        contact_email: '', // For new contact
        contact_phone: '', // For new contact
        status: 'new',
        source: 'website',
        notes: '',
        deal_value: '',
        expected_close: '',
        lead_score: '',
        lead_owner: user ? String(user.id) : '', // Default to current user if available
        priority: 'Medium',
        title: '',
        positions: '', // Assuming this is a text field for job positions
        tags: '', // Assuming tags are comma-separated strings for now
    });

    // Inline contact error state
    const [inlineContactErrors, setInlineContactErrors] = useState({});

    const handleSubmit = (e) => {
        e.preventDefault();
        // Prepare tags: split string into array, trim whitespace, filter empty
        const tagsArray = data.tags.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '');

        post(route('leads.store'), {
            data: { ...data, tags: tagsArray }, // Send tags as an array
            preserveScroll: true,
        });
    };

    // Handle inline company creation
    const handleSaveCompany = async () => {
        if (!data.company_name) return;
        // Optionally, you can add more validation here
        try {
            const response = await axios.post(route('contact.company.store'), {
                name: data.company_name,
                website: data.company_website,
            });
            if (response.data && response.data.company) {
                // Add new company to companies list
                companies.push(response.data.company);
                setData('company_id', response.data.company.id);
                setShowNewCompany(false);
                //setTab('lead');
            }
        } catch (error) {
            // Handle validation or server errors
            if (error.response && error.response.data && error.response.data.errors) {
                // Set errors for company fields
                Object.entries(error.response.data.errors).forEach(([field, message]) => {
                    errors[field] = message;
                });
            } else {
                alert('Failed to create company. Please try again.');
            }
        }
    };

    // Handle inline contact creation
    const handleSaveContact = async () => {
        if (!data.contact_name || !data.company_id) return;
        setInlineContactErrors({});
        try {
            const response = await axios.post(route('contacts.store'), {
                name: data.contact_name,
                email: data.contact_email,
                phone: data.contact_phone,
                company_id: data.company_id,
            });
            if (response.data && response.data.contact) {
                // Add new contact to filteredContacts
                setFilteredContacts(prev => {
                    const updated = [...prev, response.data.contact];
                    // Ensure the new contact is selected
                    setData('contact_id', response.data.contact.id);
                    return updated;
                });
                // Reset inline contact form fields and errors
                setData(prev => ({
                    ...prev,
                    contact_name: '',
                    contact_email: '',
                    contact_phone: '',
                }));
                setInlineContactErrors({});
                setShowNewContact(false);
                //setTab('lead');
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.errors) {
                setInlineContactErrors(error.response.data.errors);
            } else {
                alert('Failed to create contact. Please try again.');
            }
        }
    };

    // Watch for company_id changes to fetch contacts
    React.useEffect(() => {
        if (data.company_id) {
            axios.get(route('company.contacts', { company: data.company_id }))
                .then(res => {
                    setFilteredContacts(res.data.contacts || []);
                })
                .catch(() => setFilteredContacts([]));
        } else {
            setFilteredContacts([]);
            setData('contact_id', ''); // Clear contact selection if no company
        }
        // eslint-disable-next-line
    }, [data.company_id]);

    const commonInputClasses = "block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md";
    const commonLabelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center";
    const commonSelectClasses = `${commonInputClasses} appearance-none`;

    return (
        <AuthenticatedLayout user={user} title="Add New Lead">
            <Head title="Add Lead" />
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
                 {/* Display general validation errors if not tied to specific fields */}
                {errors && Object.keys(errors).length > 0 && !Object.values(errors).every(e => e === null || e === '') && (
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
                            { key: 'contact', label: 'Primary Contact', icon: User }
                        ].map(item => (
                            <button 
                                key={item.key}
                                type="button" 
                                className={`flex items-center gap-2 whitespace-nowrap pb-3 pt-1 px-3 border-b-2 font-medium text-sm sm:text-base transition-colors duration-150
                                            ${tab === item.key 
                                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'}
                                            ${item.key === 'contact' && !data.company_id ? ' opacity-50 pointer-events-none cursor-not-allowed' : ''}`}
                                onClick={() => item.key === 'contact' && !data.company_id ? null : setTab(item.key)}
                                disabled={item.key === 'contact' && !data.company_id}
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
                                        <label htmlFor="status" className={commonLabelClasses}>Status <span className="text-red-500 ml-1">*</span></label>
                                        <select id="status" className={commonSelectClasses} value={data.status} onChange={e => setData('status', e.target.value)}>
                                            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        {errors.status && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.status}</div>}
                                    </div>
                                    <div>
                                        <label htmlFor="source" className={commonLabelClasses}>Source <span className="text-red-500 ml-1">*</span></label>
                                        <select id="source" className={commonSelectClasses} value={data.source} onChange={e => setData('source', e.target.value)}>
                                            {sourceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        {errors.source && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.source}</div>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                        <label htmlFor="priority" className={commonLabelClasses}>Priority <span className="text-red-500 ml-1">*</span></label>
                                        <select id="priority" className={commonSelectClasses} value={data.priority} onChange={e => setData('priority', e.target.value)}>
                                            {priorityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        {errors.priority && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.priority}</div>}
                                    </div>
                                    <div>
                                        <label htmlFor="lead_owner" className={commonLabelClasses}><User size={16} className="mr-2 text-gray-400 dark:text-gray-500" />Lead Owner <span className="text-red-500 ml-1">*</span></label>
                                        <select
                                            id="lead_owner"
                                            className={commonSelectClasses}
                                            value={data.lead_owner}
                                            onChange={e => setData('lead_owner', e.target.value)}
                                        >
                                            {(!data.lead_owner || data.lead_owner === '') && (
                                                <option value="">-- Select Lead Owner --</option>
                                            )}
                                            {users.map(u => (
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
                                    <label htmlFor="notes" className={commonLabelClasses}><AlignLeft size={16} className="mr-2 text-gray-400 dark:text-gray-500" />Notes <span className="text-red-500 ml-1">*</span></label>
                                    <textarea id="notes" rows="4" className={commonInputClasses} value={data.notes} required onChange={e => setData('notes', e.target.value)} placeholder="Add any relevant notes about this lead..."></textarea>
                                    {errors.notes && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.notes}</div>}
                                </div>
                            </div>
                        )}

                        {tab === 'company' && (
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="company_id" className={commonLabelClasses}><Building size={16} className="mr-2 text-gray-400 dark:text-gray-500" />Select Existing Company <span className="text-red-500 ml-1">*</span></label>
                                    <select id="company_id" className={commonSelectClasses} value={data.company_id} onChange={e => { setData('company_id', e.target.value); if(e.target.value) setShowNewCompany(false); }}>
                                        <option value="">-- Select Company --</option>
                                        {companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
                                    </select>
                                    {errors.company_id && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.company_id}</div>}
                                </div>
                                <div className="flex items-center">
                                    <hr className="flex-grow border-gray-300 dark:border-gray-600"/>
                                    <span className="px-3 text-xs text-gray-500 dark:text-gray-400">OR</span>
                                    <hr className="flex-grow border-gray-300 dark:border-gray-600"/>
                                </div>
                                <div>
                                    <button type="button" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center" onClick={() => {setShowNewCompany(v => !v); if(!showNewCompany) setData('company_id', '');}}>
                                        <PlusCircle size={16} className="mr-1.5"/> {showNewCompany ? 'Cancel Adding New Company' : 'Add New Company'}
                                    </button>
                                </div>
                                {showNewCompany && (
                                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-6 bg-gray-50 dark:bg-gray-700/30">
                                        <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200">New Company Details</h3>
                                        <div>
                                            <label htmlFor="company_name" className={commonLabelClasses}>Company Name <span className="text-red-500 ml-1">*</span></label>
                                            <input type="text" id="company_name" className={commonInputClasses} value={data.company_name} onChange={e => setData('company_name', e.target.value)} placeholder="New Company Inc."/>
                                            {errors.company_name && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.company_name}</div>}
                                        </div>
                                        <div>
                                            <label htmlFor="company_website" className={commonLabelClasses}><Globe size={16} className="mr-2 text-gray-400 dark:text-gray-500" />Company Website (Optional)</label>
                                            <input type="url" id="company_website" className={commonInputClasses} value={data.company_website} onChange={e => setData('company_website', e.target.value)} placeholder="https://newcompany.com"/>
                                            {errors.company_website && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.company_website}</div>}
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-all text-sm font-medium"
                                                onClick={handleSaveCompany}
                                                disabled={!data.company_name || processing}
                                            >
                                                <Save size={16} className="mr-2" /> Save Company & Continue
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {tab === 'contact' && (
                             <div className="space-y-6">
                                <div>
                                    <label htmlFor="contact_id" className={commonLabelClasses}><User size={16} className="mr-2 text-gray-400 dark:text-gray-500" />Select Existing Contact (Optional)</label>
                                    <select id="contact_id" className={commonSelectClasses} value={data.contact_id} onChange={e => { setData('contact_id', e.target.value); if(e.target.value) setShowNewContact(false); }} disabled={!data.company_id}>
                                        <option value="">-- Select Contact --</option>
                                        {filteredContacts.map(contact => <option key={contact.id} value={contact.id}>{contact.name} ({contact.email})</option>)}
                                    </select>
                                    {errors.contact_id && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.contact_id}</div>}
                                </div>
                                 <div className="flex items-center">
                                    <hr className="flex-grow border-gray-300 dark:border-gray-600"/>
                                    <span className="px-3 text-xs text-gray-500 dark:text-gray-400">OR</span>
                                    <hr className="flex-grow border-gray-300 dark:border-gray-600"/>
                                </div>
                                <div>
                                     <button type="button" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center" onClick={() => {setShowNewContact(v => !v); if(!showNewContact) setData('contact_id', '');}}>
                                        <PlusCircle size={16} className="mr-1.5"/> {showNewContact ? 'Cancel Adding New Contact' : 'Add New Contact (if not listed)'}
                                    </button>
                                </div>
                                {showNewContact && (
                                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-6 bg-gray-50 dark:bg-gray-700/30">
                                        <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200">New Contact Details</h3>
                                        <div>
                                            <label htmlFor="contact_name" className={commonLabelClasses}>Contact Name <span className="text-red-500 ml-1">*</span></label>
                                            <input type="text" id="contact_name" className={commonInputClasses} value={data.contact_name} onChange={e => setData('contact_name', e.target.value)} placeholder="e.g., Alex Smith"/>
                                            {(inlineContactErrors.name || errors.contact_name) && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{inlineContactErrors.name || errors.contact_name}</div>}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="contact_email" className={commonLabelClasses}><Mail size={16} className="mr-2 text-gray-400 dark:text-gray-500" />Contact Email</label>
                                                <input type="email" id="contact_email" className={commonInputClasses} value={data.contact_email} onChange={e => setData('contact_email', e.target.value)} placeholder="e.g., alex.smith@example.com"/>
                                                {inlineContactErrors.email && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{inlineContactErrors.email}</div>}
                                            </div>
                                            <div>
                                                <label htmlFor="contact_phone" className={commonLabelClasses}><PhoneIcon size={16} className="mr-2 text-gray-400 dark:text-gray-500" />Contact Phone</label>
                                                <input type="text" id="contact_phone" className={commonInputClasses} value={data.contact_phone} onChange={e => setData('contact_phone', e.target.value)} placeholder="e.g., (555) 123-4567"/>
                                                {inlineContactErrors.phone && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{inlineContactErrors.phone}</div>}
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-all text-sm font-medium"
                                                onClick={handleSaveContact}
                                                disabled={!data.contact_name || !data.company_id || processing}
                                            >
                                                <Save size={16} className="mr-2" /> Save Contact & Continue
                                            </button>
                                        </div>
                                    </div>
                                )}
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
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} className="mr-2" />
                                        Save Lead
                                    </>
                                )}
                            </button>
                        </div>
                        {recentlySuccessful && (
                            <div className="mt-4 p-3 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-md text-sm text-green-700 dark:text-green-200">
                                Lead created successfully!
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
