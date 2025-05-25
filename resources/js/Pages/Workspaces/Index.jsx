import React, { useState } from 'react';
import { Head, Link, usePage, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react';

export default function WorkspacesIndex({ user, workspaces }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });
    const { props } = usePage();
    const flash = props.flash || {};
    const [isModalOpen, setIsModalOpen] = useState(false);
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('workspaces.store'), {
            onSuccess: () => {
                reset();
                closeModal();
            },
        });
    };

    return (
        <AuthenticatedLayout user={user} title="Workspaces">
            <Head title="Workspaces" />
            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                        Manage Workspaces
                    </h1>
                    <button
                        onClick={openModal}
                        className="inline-flex cursor-pointer items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                    >
                        <Plus size={18} className="mr-2 -ml-1" />
                        Add Workspace
                    </button>
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
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {workspaces && workspaces.length > 0 ? (
                                    workspaces.map(ws => (
                                        <tr key={ws.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{ws.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{ws.description || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex items-center justify-center space-x-2">
                                                    {/* Only show Edit if user is an owner of this workspace */}
                                                    {ws.isOwner && (
                                                        <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300" title="Edit">
                                                            <Pencil size={16} />
                                                        </button>
                                                    )}
                                                    {/* Delete button is always disabled or removed */}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                            No workspaces found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {/* Modal for adding workspace */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6 sm:px-0 bg-[rgba(0,0,0,0.6)]">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden w-full max-w-md transform transition-all" onClick={e => e.stopPropagation()}>
                        <form onSubmit={submit} className="p-6">
                            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add Workspace</h2>
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
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition ease-in-out duration-150">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition ease-in-out duration-150" disabled={processing}>{processing ? 'Saving...' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
