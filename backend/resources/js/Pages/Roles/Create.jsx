import React from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function RolesCreate({ permissions = [], user }) {
    const { data, setData, post, processing, errors, reset } = useForm({ name: '', permissions: [] });
    const { props } = usePage();

    const submit = (e) => {
        e.preventDefault();
        post(route('roles.store'));
    };

    return (
        <AuthenticatedLayout user={user || props.auth?.user} title="Add Role">
            <Head title="Add Role" />
            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6">Add Role</h1>
                <form onSubmit={submit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                        />
                        {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Permissions</label>
                        <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-700">
                            {permissions.length > 0 ? permissions.map(p => (
                                <label key={p.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        value={p.id}
                                        checked={data.permissions.includes(p.id)}
                                        onChange={e => {
                                            if (e.target.checked) {
                                                setData('permissions', [...data.permissions, p.id]);
                                            } else {
                                                setData('permissions', data.permissions.filter(id => id !== p.id));
                                            }
                                        }}
                                        className="accent-blue-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-200">{p.name}</span>
                                </label>
                            )) : (
                                <span className="text-gray-400 text-xs">No permissions found.</span>
                            )}
                        </div>
                        {errors.permissions && <div className="text-red-500 text-sm mt-1">{errors.permissions}</div>}
                    </div>
                    <div className="flex justify-end space-x-2 mt-6">
                        <Link href={route('roles.index')} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150">Cancel</Link>
                        <button type="submit" className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition ease-in-out duration-150" disabled={processing}>{processing ? 'Saving...' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}