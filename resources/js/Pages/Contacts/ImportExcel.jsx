import React, { useState } from 'react';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CheckCircle2, XCircle, UploadCloud, FileSpreadsheet, ArrowLeft, Save } from 'lucide-react';

export default function ImportExcel({ }) { // Removed user prop as it's available via usePage
    const { props } = usePage();
    const user = props.auth?.user; // Get user from props.auth
    const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({ 
        file: null 
    });
    const flash = props.flash || {};
    // Removed local success state, rely on flash.success or recentlySuccessful from useForm

    const handleFileChange = (e) => {
        setData('file', e.target.files[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('contacts.import_excel.store'), { // Assuming this is the correct route for storing imported contacts
            preserveScroll: true,
            onSuccess: () => {
                reset('file'); // Reset only the file input on success
            },
            // onError: () => { /* Errors are handled by `errors` from useForm */ }
        });
    };

    const commonInputClasses = "block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md";
    const commonLabelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center";


    return (
        <AuthenticatedLayout user={user} title="Import Contacts & Companies">
            <Head title="Import Contacts & Companies" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 w-full mx-auto">

                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-100 flex items-center self-start sm:self-center">
                        <UploadCloud size={28} className="mr-3 text-blue-500" />
                        Import from Excel
                    </h1>
                    <Link 
                        href={route('contacts.index')} // Assuming a route to go back to contacts list
                        className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors self-end sm:self-center"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Contacts
                    </Link>
                </div>
                
                {flash.success && (
                    <div className="mb-5 p-4 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-200 flex items-center shadow" role="alert">
                        <CheckCircle2 size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {/* Displaying recentlySuccessful from useForm if no global flash.success */}
                {recentlySuccessful && !flash.success && (
                     <div className="mb-5 p-4 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-200 flex items-center shadow" role="alert">
                        <CheckCircle2 size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>File import initiated successfully! Processing may take a few moments.</span>
                    </div>
                )}
                {flash.error && (
                    <div className="mb-5 p-4 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-200 flex items-center shadow" role="alert">
                        <XCircle size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.error}</span>
                    </div>
                )}
                 {errors && errors.file && ( // Specific error for file
                    <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 rounded-lg text-sm" role="alert">
                        <XCircle size={20} className="mr-2.5 flex-shrink-0 inline" aria-hidden="true" />
                        <span>{errors.file}</span>
                    </div>
                )}


                <form 
                    onSubmit={handleSubmit} 
                    className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8 space-y-6"
                >
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                            <FileSpreadsheet size={22} className="mr-3 text-blue-500" />
                            Upload File
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Select an Excel file (.xls, .xlsx) to import contacts and companies.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="excel-file" className={commonLabelClasses}>
                            Excel File <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input 
                            type="file" 
                            id="excel-file"
                            accept=".xls,.xlsx" 
                            onChange={handleFileChange} 
                            className={`file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-700/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-700/50 file:cursor-pointer ${commonInputClasses} p-0`} // Removed p-0 from file input to allow Tailwind padding
                            required 
                        />
                        {/* errors.file is handled above the form now */}
                    </div>
                    
                    <div className="mt-8 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold mb-1.5">Supported Excel Columns:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-700 dark:text-gray-200">name</code> (Required for Contact)</li>
                            <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-700 dark:text-gray-200">company</code> (Company Name)</li>
                            <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-700 dark:text-gray-200">email</code></li>
                            <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-700 dark:text-gray-200">phone</code></li>
                            <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-700 dark:text-gray-200">title</code> (Contact's Job Title)</li>
                            <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-700 dark:text-gray-200">notes</code></li>
                        </ul>
                        <p className="mt-2 font-semibold">Important: At least one of <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-700 dark:text-gray-200">email</code> or <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-700 dark:text-gray-200">phone</code> is required per contact row.</p>
                    </div>


                    <div className="flex flex-row justify-end items-center space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-2">
                        <Link 
                            href={route('contacts.index')} // Or a more general dashboard/previous page
                            className="flex-1 sm:flex-none sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-all duration-150 shadow-sm hover:shadow-md"
                        >
                            <XCircle size={18} className="mr-2" />
                            Cancel
                        </Link>
                        <button 
                            type="submit" 
                            className="flex-1 sm:flex-none sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 text-sm font-medium" 
                            disabled={processing || !data.file}
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <UploadCloud size={18} className="mr-2" />
                                    Import File
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
