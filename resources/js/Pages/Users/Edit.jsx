import React from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/parts/Sidebar';

export default function UsersEdit({ user, roles }) {
    const { props } = usePage();
    const { data, setData, put, processing, errors } = useForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        roles: user.roles ? user.roles.map(r => r.id) : [],
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('users.update', user.id));
    };
    return (
        <>
            <Head title="Edit User" />
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
                <Sidebar user={props.auth?.user} />
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    <main className="flex-1 relative overflow-y-auto focus:outline-none">
                        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto">
                            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Edit User</h1>
                            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                                <div className="mb-4">
                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                    <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" required />
                                    {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                                </div>
                                <div className="mb-4">
                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                    <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" required />
                                    {errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
                                </div>
                                <div className="mb-4">
                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Password <span className="text-xs text-gray-400">(leave blank to keep current)</span></label>
                                    <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
                                    {errors.password && <div className="text-red-500 text-sm mt-1">{errors.password}</div>}
                                </div>
                                <div className="mb-4">
                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Roles</label>
                                    <select multiple value={data.roles} onChange={e => setData('roles', Array.from(e.target.selectedOptions, option => option.value))} className="w-full border px-3 py-2 rounded shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                    {errors.roles && <div className="text-red-500 text-sm mt-1">{errors.roles}</div>}
                                </div>
                                <div className="flex justify-end space-x-2 mt-6">
                                    <Link href={route('users.index')} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">Cancel</Link>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition ease-in-out duration-150" disabled={processing}>{processing ? 'Saving...' : 'Save'}</button>
                                </div>
                            </form>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
