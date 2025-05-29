import React from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CheckCircle2, XCircle, User, Mail as MailIcon, Phone as PhoneIcon, Briefcase as BriefcaseIcon, AlignLeft, Building, Save, ArrowLeft } from 'lucide-react'; // Added more icons

export default function Create({user}) { // Assuming props are destructured or passed directly
    const { props } = usePage();
    
    const flash = props.flash || {};
    const companies = props.companies || []; // Ensure companies is an array

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        name: '',
        email: '',
        phone: '',
        title: '',
        notes: '',
        company_id: '', // Initialize company_id
    });

    const [showNewCompany, setShowNewCompany] = React.useState(false);
    const [newCompanyName, setNewCompanyName] = React.useState('');
    const [creatingCompany, setCreatingCompany] = React.useState(false);
    const [companyError, setCompanyError] = React.useState('');
    const [companyList, setCompanyList] = React.useState(companies);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Ensure company_id is sent as a number (not string) if not empty
        const payload = {
            ...data,
            company_id: data.company_id ? Number(data.company_id) : '',
        };
        post(route('contacts.store'), {
            ...payload,
            preserveScroll: true,
        });
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling to parent form
        setCompanyError('');
        if (!newCompanyName.trim()) {
            setCompanyError('Company name is required.');
            return;
        }
        setCreatingCompany(true);
        try {
            const response = await fetch(route('contact.company.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({ name: newCompanyName }),
            });
            const result = await response.json();
            if (response.ok && result && result.company) {
                setCompanyList(prev => [...prev, result.company]);
                setData('company_id', result.company.id);
                setShowNewCompany(false);
                setNewCompanyName('');
            } else {
                setCompanyError(result.message || 'Failed to create company.');
            }
        } catch (err) {
            setCompanyError('Failed to create company.');
        } finally {
            setCreatingCompany(false);
        }
    };

    return (
        <AuthenticatedLayout user={user} title="Add New Contact">
            <Head title="Create Contact" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 w-full mx-auto"> {/* Adjusted max-width slightly */}

            

                {flash.success && (
                    <div className="mb-5 p-4 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-200 flex items-center shadow" role="alert">
                        <CheckCircle2 size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && ( // General error display if any
                    <div className="mb-5 p-4 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-200 flex items-center shadow" role="alert">
                        <XCircle size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.error || 'An unexpected error occurred.'}</span>
                    </div>
                )}

                {/* Show all validation errors at the top of the form */}
                {Object.keys(errors).length > 0 && (
                    <div className="mb-5 p-4 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-200 shadow" role="alert">
                        <ul className="list-disc pl-5">
                            {Object.entries(errors).map(([field, message]) => (
                                <li key={field}>{message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <form 
                    onSubmit={handleSubmit} 
                    className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8 space-y-6"
                >
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                            <User size={22} className="mr-3 text-blue-500" />
                            Contact Information
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Enter the details for the new contact.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="name" className="flex text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 items-center">
                            Full Name <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="name"
                            value={data.name} 
                            onChange={e => setData('name', e.target.value)} 
                            className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md" 
                            required 
                            placeholder="e.g., Jane Doe"
                        />
                        {errors.name && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.name}</div>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="email" className="flex text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 items-center">
                                <MailIcon size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Email Address
                            </label>
                            <input 
                                type="email" 
                                id="email"
                                value={data.email} 
                                onChange={e => setData('email', e.target.value)} 
                                className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md" 
                                placeholder="e.g., jane.doe@example.com"
                            />
                            {errors.email && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.email}</div>}
                        </div>

                        <div>
                            <label htmlFor="phone" className="flex text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 items-center">
                                <PhoneIcon size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Phone Number
                            </label>
                            <input 
                                type="text" 
                                id="phone"
                                value={data.phone} 
                                onChange={e => setData('phone', e.target.value)} 
                                className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md" 
                                placeholder="e.g., (123) 456-7890"
                            />
                            {errors.phone && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.phone}</div>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="company_id" className="flex text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 items-center">
                                <Building size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Company <span className="text-red-500 ml-1">*</span>
                            </label>
                            <select
                                id="company_id"
                                value={data.company_id || ''}
                                onChange={e => setData('company_id', e.target.value)}
                                className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md appearance-none"
                                required
                                disabled={showNewCompany}
                            >
                                <option value="">Select a company</option>
                                {companyList.map(company => (
                                    <option key={company.id} value={company.id}>{company.name}</option>
                                ))}
                            </select>
                            {errors.company_id && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.company_id}</div>}
                            <button
                                type="button"
                                className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                                onClick={() => setShowNewCompany(v => !v)}
                            >
                                {showNewCompany ? 'Cancel' : '+ Add new company'}
                            </button>
                            {showNewCompany && (
                                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col gap-2">
                                    <label htmlFor="new_company_name" className="text-xs font-medium text-gray-700 dark:text-gray-300">Company Name <span className="text-red-500">*</span></label>
                                    <input
                                        id="new_company_name"
                                        type="text"
                                        value={newCompanyName}
                                        onChange={e => setNewCompanyName(e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700/50 text-sm"
                                        placeholder="e.g., New Company Inc."
                                        disabled={creatingCompany}
                                    />
                                    {companyError && <div className="text-xs text-red-500 mt-1">{companyError}</div>}
                                    <button
                                        type="button"
                                        className="mt-2 inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-60"
                                        disabled={creatingCompany}
                                        onClick={handleCreateCompany}
                                    >
                                        {creatingCompany ? 'Creating...' : 'Create & Select'}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="title" className="flex text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 items-center">
                                <BriefcaseIcon size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Job Title (Optional)
                            </label>
                            <input 
                                type="text" 
                                id="title"
                                value={data.title} 
                                onChange={e => setData('title', e.target.value)} 
                                className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md" 
                                placeholder="e.g., Marketing Manager"
                            />
                            {errors.title && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.title}</div>}
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="notes" className="flex text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 items-center">
                           <AlignLeft size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Notes (Optional)
                        </label>
                        <textarea 
                            id="notes"
                            rows="4"
                            value={data.notes} 
                            onChange={e => setData('notes', e.target.value)} 
                            className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md"
                            placeholder="e.g., Met at the tech conference, interested in our new product..."
                        ></textarea>
                        {errors.notes && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.notes}</div>}
                    </div>

                    <div className="flex flex-row justify-end items-center space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Link 
                            href={route('contacts.index')} 
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
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save size={18} className="mr-2" />
                                    Create Contact
                                </>
                            )}
                        </button>
                    </div>
                    {recentlySuccessful && (
                        <div className="mt-4 p-3 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-md text-sm text-green-700 dark:text-green-200">
                            Contact created successfully!
                        </div>
                    )}
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
