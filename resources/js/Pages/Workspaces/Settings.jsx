import React from 'react';
import { Head, Link, usePage, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CheckCircle2, XCircle, Settings, Save, ArrowLeft, Building } from 'lucide-react';

export default function WorkspaceSettings({ workspace }) {
    // Ensure workspace is an object, even if null/undefined initially
    const currentWorkspace = workspace || {};
    const { props } = usePage();
    const authUser = props.auth?.user; // User for AuthenticatedLayout
    const flash = props.flash || {};

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        name: currentWorkspace.name || '',
        description: currentWorkspace.description || '',
        // Add any other workspace settings fields here if they exist
    });

    const commonInputClasses = "block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md";
    const commonLabelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center";

    const handleSubmit = (e) => {
        e.preventDefault();
        // Assuming the route 'workspace.settings.update' expects POST and handles the current workspace contextually (e.g., via session or user's current workspace)
        // If it needs workspace ID, you might need to adjust the route or include it in the form data if not implicit.
        post(route('workspace.settings.update'), { // Using post as per original, adjust if backend expects PUT
            preserveScroll: true,
            // onSuccess: () => { /* Optional: handle success if needed beyond flash */ }
        });
    };

    return (
        <AuthenticatedLayout user={authUser} title="Workspace Settings">
            <Head title="Workspace Settings" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">

               
                {flash.success && (
                    <div className="mb-5 p-4 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-200 flex items-center shadow" role="alert">
                        <CheckCircle2 size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="mb-5 p-4 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-200 flex items-center shadow" role="alert">
                        <XCircle size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.error || 'An unexpected error occurred.'}</span>
                    </div>
                )}
                {/* Display general validation errors if not tied to specific fields */}
                {errors && Object.keys(errors).length > 0 && !Object.values(errors).every(e => e === null || e === '') && !errors.name && !errors.description && (
                    <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 rounded-lg text-sm" role="alert">
                        <p className="font-medium mb-1">Please correct the following errors:</p>
                        <ul className="list-disc list-inside">
                            {Object.entries(errors).map(([field, message]) => message ? <li key={field}>{message}</li> : null)}
                        </ul>
                    </div>
                )}


                <form 
                    onSubmit={handleSubmit} 
                    className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8 space-y-6"
                >
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                            <Building size={22} className="mr-3 text-blue-500" />
                            General Information
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Update your workspace's name and description.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="ws-name" className={commonLabelClasses}>
                            Workspace Name <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="text"
                            id="ws-name"
                            className={commonInputClasses}
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            required
                            placeholder="e.g., My Awesome Workspace"
                        />
                        {errors.name && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.name}</div>}
                    </div>

                    <div>
                        <label htmlFor="ws-description" className={commonLabelClasses}>
                            Description (Optional)
                        </label>
                        <textarea
                            id="ws-description"
                            rows="4"
                            className={commonInputClasses}
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            placeholder="A brief description of what this workspace is for..."
                        />
                        {errors.description && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.description}</div>}
                    </div>

                    {/* Add other workspace settings fields here as needed */}

                    <div className="flex flex-row justify-end items-center space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-2">
                        <Link 
                            href={route('workspaces.index')} 
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
                                    Update Settings
                                </>
                            )}
                        </button>
                    </div>
                    {recentlySuccessful && (
                        <div className="mt-4 p-3 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-md text-sm text-green-700 dark:text-green-200">
                            Workspace settings updated successfully!
                        </div>
                    )}
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
