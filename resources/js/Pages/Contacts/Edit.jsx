import React from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CheckCircle2, XCircle, User, Mail as MailIcon, Phone as PhoneIcon, Briefcase as BriefcaseIcon, AlignLeft, Building, Save, ArrowLeft, Edit3 } from 'lucide-react'; // Added Edit3 icon
import FlashMessages from './partials/FlashMessages';
import ValidationErrors from './partials/ValidationErrors';
import ContactFormFields from './partials/ContactFormFields';

export default function Edit({ contact, companies, user }) { // Destructure props directly
    const { props } = usePage();
   
    const flash = props.flash || {};
    // Ensure companies is an array, even if not passed or null
    const companiesList = companies || [];


    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        title: contact.title || '',
        notes: contact.notes || '',
        company_id: contact.company_id || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('contacts.update', contact.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout user={user} title={`Edit Contact: ${contact.name}`}>
            <Head title={`Edit ${contact.name}`} />
            <div className="py-8 px-4 sm:px-6 lg:px-8 w-full mx-auto">
                <FlashMessages flash={flash} />
                <ValidationErrors errors={errors} />
                <form 
                    onSubmit={handleSubmit}
                    className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8 space-y-6"
                >
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                            <Edit3 size={22} className="mr-3 text-blue-500" />
                            Edit Contact Information
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Update the details for <span className="font-medium text-gray-700 dark:text-gray-200">{contact.name}</span>.
                        </p>
                    </div>
                    <ContactFormFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        companies={companiesList}
                        companyList={companiesList}
                        showNewCompany={false}
                        setShowNewCompany={() => {}}
                        newCompanyName={''}
                        setNewCompanyName={() => {}}
                        creatingCompany={false}
                        companyError={''}
                        handleCreateCompany={() => {}}
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
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save size={18} className="mr-2" />
                                    Update Contact
                                </>
                            )}
                        </button>
                    </div>
                    {recentlySuccessful && (
                        <div className="mt-4 p-3 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-md text-sm text-green-700 dark:text-green-200">
                            Contact updated successfully!
                        </div>
                    )}
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
