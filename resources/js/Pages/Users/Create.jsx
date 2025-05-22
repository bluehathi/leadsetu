import React, { useState } from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/parts/Sidebar';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function UsersCreate({ roles }) {
    const { props } = usePage();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        roles: [],
    });
    const flash = props.flash || {};
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('users.store'));
    };
    return (
        <>
            <Head title="Add User" />
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
                <Sidebar user={props.auth?.user} />
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    <main className="flex-1 relative overflow-y-auto focus:outline-none">
                        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto">
                            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Add User</h1>
                                <Link href={route('users.index')} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">Back</Link>
                            </div>
                            {flash.success && (
                                <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 rounded-md flex items-center justify-between" role="alert">
                                    <div className="flex items-center">
                                        <CheckCircle2 size={20} className="mr-2 flex-shrink-0" aria-hidden="true" />
                                        <span>{flash.success}</span>
                                    </div>
                                </div>
                            )}
                            {flash.error && (
                                <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md flex items-center justify-between" role="alert">
                                    <div className="flex items-center">
                                        <XCircle size={20} className="mr-2 flex-shrink-0" aria-hidden="true" />
                                        <span>{flash.error}</span>
                                    </div>
                                </div>
                            )}
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
                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                    <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" required />
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
