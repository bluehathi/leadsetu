import React from 'react';
import { useForm, Link, usePage, Head } from '@inertiajs/react';
import CompanyLayout from './_CompanyLayout'; // Assuming this path is correct
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'; // Assuming this path is correct
import { Save, XCircle, Briefcase, Building, Link2, Edit } from 'lucide-react'; // Added Edit icon

export default function CompaniesEdit({ company }) {
    const { props } = usePage();
    const user = props.auth?.user;
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        name: company.name || '',
        description: company.description || '',
        website: company.website || '',
    });

    const submit = e => {
        e.preventDefault();
        put(route('companies.update', company.id), {
            preserveScroll: true, // Optional: preserve scroll position on submit
        });
    };

    return (
        <>
            <Head title={`Edit ${company.name}`} />
            <AuthenticatedLayout user={user} title={`Edit Company: ${company.name}`}>
                <CompanyLayout user={user} title={`Edit Company: ${company.name}`}>
                    
                    <div className="max-w-2xl mx-auto"> {/* Centered form container */}
                        <form 
                            onSubmit={submit} 
                            className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8 space-y-6"
                        >
                            {/* Form Section Title */}
                            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                                    <Edit size={22} className="mr-3 text-blue-500" />
                                    Edit Company Details
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Update the information for <span className="font-medium text-gray-700 dark:text-gray-200">{company.name}</span>.
                                </p>
                            </div>

                            {/* Company Name Field */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                                    <Building size={16} className="mr-2 text-gray-400 dark:text-gray-500" />
                                    Company Name <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="name"
                                    className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md"
                                    value={data.name} 
                                    onChange={e => setData('name', e.target.value)} 
                                    required 
                                    placeholder="e.g., Acme Corp"
                                />
                                {errors.name && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.name}</div>}
                            </div>

                            {/* Description Field */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Description (Optional)
                                </label>
                                <textarea 
                                    id="description"
                                    rows="3"
                                    className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md"
                                    value={data.description} 
                                    onChange={e => setData('description', e.target.value)}
                                    placeholder="e.g., A leading provider of innovative solutions..."
                                />
                                {errors.description && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.description}</div>}
                            </div>

                            {/* Website Field */}
                            <div>
                                <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                                     <Link2 size={16} className="mr-2 text-gray-400 dark:text-gray-500" />
                                    Website (Optional)
                                </label>
                                <input 
                                    type="url" 
                                    id="website"
                                    className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md"
                                    value={data.website} 
                                    onChange={e => setData('website', e.target.value)} 
                                    placeholder="e.g., https://www.acmecorp.com"
                                />
                                {errors.website && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.website}</div>}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-row justify-end items-center space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <Link 
                                    href={route('companies.index')} 
                                    className="flex-1 sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-all duration-150 shadow-sm hover:shadow-md"
                                >
                                    <XCircle size={18} className="mr-2" />
                                    Cancel
                                </Link>
                                <button 
                                    type="submit" 
                                    className="flex-1 sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 text-sm font-medium" 
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
                                            Update 
                                        </>
                                    )}
                                </button>
                            </div>
                             {recentlySuccessful && (
                                <div className="mt-4 p-3 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-md text-sm text-green-700 dark:text-green-200">
                                    Company updated successfully!
                                </div>
                            )}
                        </form>
                    </div>
                </CompanyLayout>
            </AuthenticatedLayout>
        </>
    );
}
