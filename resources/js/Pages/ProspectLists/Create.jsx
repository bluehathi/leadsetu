import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'; // Assuming this is your main layout
// import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'; // For flash messages
import { CheckCircle2, AlertTriangle } from 'lucide-react'; // Import Lucide React icons

export default function ProspectListsCreate({ user }) { // Assuming 'user' is passed as a prop
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });
    const { flash } = usePage().props; // Get flash messages

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('prospect-lists.store'), {
            onSuccess: () => reset(), // Optionally reset form on success
        });
    };

    return (
        <AuthenticatedLayout
            user={user} // Pass user to layout
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Create New Prospect List
                </h2>
            }
        >
            <Head title="Create Prospect List" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
                        <div className="p-6 md:p-8">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                Add New Prospect List
                            </h3>

                            {flash?.success && (
                                <div
                                    className="mb-6 p-4 bg-green-50 dark:bg-green-800/30 border border-green-300 dark:border-green-600 rounded-md text-sm text-green-700 dark:text-green-200 flex items-center"
                                    role="alert"
                                >
                                    <CheckCircle2 className="h-5 w-5 mr-3 text-green-500 dark:text-green-400 flex-shrink-0" />
                                    <span>{flash.success}</span>
                                </div>
                            )}
                            {flash?.error && (
                                <div
                                    className="mb-6 p-4 bg-red-50 dark:bg-red-800/30 border border-red-300 dark:border-red-600 rounded-md text-sm text-red-700 dark:text-red-200 flex items-center"
                                    role="alert"
                                >
                                    <AlertTriangle className="h-5 w-5 mr-3 text-red-500 dark:text-red-400 flex-shrink-0" />
                                    <span>{flash.error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        List Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className={`mt-1 block w-full rounded-sm shadow-sm text-sm p-2
                                            ${errors.name
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                                : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400'
                                            }
                                            dark:bg-gray-700 dark:text-gray-50 dark:placeholder-gray-400`}
                                        required
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.name}</p>}
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description <span className="text-gray-500 dark:text-gray-400 text-xs">(Optional)</span>
                                    </label>
                                    <textarea
                                        id="description"
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        rows={4}
                                        className={`mt-1 block w-full rounded-md shadow-sm text-sm p-2
                                            ${errors.description
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                                : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400'
                                            }
                                            dark:bg-gray-700 dark:text-gray-50 dark:placeholder-gray-400`}
                                    />
                                    {errors.description && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.description}</p>}
                                </div>

                                <div className="flex items-center justify-start gap-4 pt-2">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                                    >
                                        {processing ? 'Saving...' : 'Create List'}
                                    </button>
                                    <Link
                                        href={route('prospect-lists.index')}
                                        className="inline-flex items-center justify-center px-6 py-2.5 border border-gray-300 dark:border-gray-500 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                                    >
                                        Cancel
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
