import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'; // Assuming this path is correct
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'; // Lucide React icons

// Helper component for form field errors
const InputError = ({ message, className = '' }) => {
    return message ? <p className={`text-sm text-red-600 dark:text-red-500 mt-1.5 ${className}`}>{message}</p> : null;
};

export default function ProspectListsCreate({ user }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });
    const { flash } = usePage().props; // Get flash messages

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('prospect-lists.store'), {
            onSuccess: () => {
                reset(); 
            },
            
        });
    };

    // Common input styling
    const commonInputStyles = "mt-1 block w-full px-3.5 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/60 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition duration-150 ease-in-out sm:text-sm";
    const errorInputStyles = "border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-500";


    return (
        <AuthenticatedLayout
            user={user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Create New Prospect List
                </h2>
            }
        >
            <Head title="Create Prospect List" />

            <div className="py-12 font-sans">
                <div className="w-full mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 shadow-xl overflow-hidden rounded-xl">
                        <div className="px-6 py-8 sm:px-8">
                            <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-8 text-center">
                                Define Your New Prospect List
                            </h3>

                            {/* Flash Messages */}
                            {flash?.success && (
                                <div
                                    className="mb-6 p-4 bg-green-50 dark:bg-green-700/30 border border-green-400 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-100 flex items-start shadow"
                                    role="alert"
                                >
                                    <CheckCircle2 className="h-5 w-5 mr-3 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                    <span>{flash.success}</span>
                                </div>
                            )}
                            {flash?.error && (
                                <div
                                    className="mb-6 p-4 bg-red-50 dark:bg-red-700/30 border border-red-400 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-100 flex items-start shadow"
                                    role="alert"
                                >
                                    <AlertTriangle className="h-5 w-5 mr-3 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    <span>{flash.error || 'An unexpected error occurred.'}</span>
                                </div>
                            )}
                             {/* Generic Info Flash Message (Example) */}
                            {flash?.info && (
                                <div
                                    className="mb-6 p-4 bg-blue-50 dark:bg-blue-700/30 border border-blue-400 dark:border-blue-600 rounded-lg text-sm text-blue-700 dark:text-blue-100 flex items-start shadow"
                                    role="alert"
                                >
                                    <Info className="h-5 w-5 mr-3 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                    <span>{flash.info}</span>
                                </div>
                            )}


                            <form onSubmit={handleSubmit} className="space-y-7">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">
                                        List Name <span className="text-red-500 dark:text-red-400">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className={`${commonInputStyles} ${errors.name ? errorInputStyles : ''}`}
                                        required
                                        placeholder="e.g., Newsletter Subscribers"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">
                                        Description <span className="text-xs text-gray-500 dark:text-gray-500">(Optional)</span>
                                    </label>
                                    <textarea
                                        id="description"
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        rows={4}
                                        className={`${commonInputStyles} min-h-[100px] ${errors.description ? errorInputStyles : ''}`}
                                        placeholder="A brief description of this prospect list..."
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-5 border-t dark:border-gray-700/50 mt-8">
                                    <Link
                                        href={route('prospect-lists.index')}
                                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all duration-150 ease-in-out"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center justify-center px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 ease-in-out"
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : 'Create List'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
