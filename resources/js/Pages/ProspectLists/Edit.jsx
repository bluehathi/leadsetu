import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function ProspectListsEdit({ user, prospectList }) {
    const { data, setData, put, processing, errors } = useForm({
        name: prospectList.name || '',
        description: prospectList.description || '',
    });
    const { props } = usePage();
    const flash = props.flash || {};

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('prospect-lists.update', prospectList.id));
    };

    return (
        <AuthenticatedLayout user={user} title="Edit Prospect List">
            <Head title="Edit Prospect List" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 w-full mx-auto max-w-xl bg-white">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Edit Prospect List</h2>
                {flash.success && (
                    <div className="mb-5 p-4 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-200 flex items-center shadow" role="alert">
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="mb-5 p-4 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-200 flex items-center shadow" role="alert">
                        <span>{flash.error}</span>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name<span className="text-red-500">*</span></label>
                        <input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            className={`block w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md`}
                            required
                        />
                        {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            className={`block w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md`}
                            rows={3}
                        />
                        {errors.description && <div className="text-xs text-red-500 mt-1">{errors.description}</div>}
                    </div>
                    <div className="flex items-center gap-3 mt-6">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                        >
                            {processing ? 'Saving...' : 'Save'}
                        </button>
                        <Link href={route('prospect-lists.index')} className="inline-flex items-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm hover:shadow-md transition-all duration-150">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
