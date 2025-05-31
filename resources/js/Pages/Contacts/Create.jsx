import React from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CheckCircle2, XCircle, User, Mail as MailIcon, Phone as PhoneIcon, Briefcase as BriefcaseIcon, AlignLeft, Building, Save, ArrowLeft } from 'lucide-react'; // Added more icons
import FlashMessages from './Partials/FlashMessages';
import ValidationErrors from './Partials/ValidationErrors';
import ContactFormFields from './Partials/ContactFormFields';

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
            <div className="py-8 px-4 sm:px-6 lg:px-8 w-full mx-auto">
                <FlashMessages flash={flash} />
                <ValidationErrors errors={errors} />
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
                    <ContactFormFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        companies={companies}
                        companyList={companyList}
                        showNewCompany={showNewCompany}
                        setShowNewCompany={setShowNewCompany}
                        newCompanyName={newCompanyName}
                        setNewCompanyName={setNewCompanyName}
                        creatingCompany={creatingCompany}
                        companyError={companyError}
                        handleCreateCompany={handleCreateCompany}
                    />
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
