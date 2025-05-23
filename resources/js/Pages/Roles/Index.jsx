import React, { useState } from 'react';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import Sidebar from '@/Components/parts/Sidebar';
import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react';

const DEFAULT_ROLE_NAMES = ["Admin", "Manager", "Sales", "Viewer"];

export default function RolesIndex({ user, roles }) {
    const { data, setData, post, processing, errors, reset } = useForm({ name: '' });
    const { props } = usePage();
    const flash = props.flash || {};
    const [isModalOpen, setIsModalOpen] = useState(false);
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('roles.store'), {
            onSuccess: () => {
                reset();
                closeModal();
            },
        });
    };

    return (
        <>
            <Head title="Roles" />
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
                <Sidebar user={user} />
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    <main className="flex-1 relative overflow-y-auto focus:outline-none">
                        <div className="py-8 px-4 sm:px-6 lg:px-8">
                            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                                    Manage Roles
                                </h1>
                                <button
                                    onClick={openModal}
                                    className="inline-flex cursor-pointer items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                                >
                                    <Plus size={18} className="mr-2 -ml-1" />
                                    Add Role
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
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Permissions</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {roles && roles.length > 0 ? (
                                                roles.map(role => (
                                                    <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{role.name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                            {role.permissions && role.permissions.length > 0 ? (
                                                                <span className="inline-flex flex-wrap gap-1">
                                                                    {role.permissions.map(p => (
                                                                        <span key={p.id} className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs font-semibold">{p.name}</span>
                                                                    ))}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                            <div className="flex items-center justify-center space-x-2">
                                                                {/* Edit Action - hide for Admin role */}
                                                                {role.name !== "Admin" && (
                                                                    <a
                                                                        href={route('roles.edit', role.id)}
                                                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil size={16} />
                                                                    </a>
                                                                )}
                                                                {/* Delete Action (SPA style) - hide for default roles */}
                                                                {!DEFAULT_ROLE_NAMES.includes(role.name) && (
                                                                    <Link
                                                                        href={route('roles.destroy', role.id)}
                                                                        method="delete"
                                                                        as="button"
                                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                        title="Delete"
                                                                        onBefore={() => confirm('Are you sure you want to delete this role?')}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                                        No roles found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
            {/* Modal for adding role */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6 sm:px-0 bg-[rgba(0,0,0,0.6)]">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden w-full max-w-md transform transition-all" onClick={e => e.stopPropagation()}>
                        <form onSubmit={submit} className="p-6">
                            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add Role</h2>
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
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition ease-in-out duration-150">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition ease-in-out duration-150" disabled={processing}>{processing ? 'Saving...' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
