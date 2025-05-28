import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage, router as InertiaRouter } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Edit2 as EditIcon, Trash2, CheckCircle2, XCircle, KeyRound, Save } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

// Placeholder for any default permission names that shouldn't be deleted/edited if applicable
// const DEFAULT_PERMISSION_NAMES = ["browse admin"]; 

export default function PermissionsIndex({ permissions: initialPermissions = [] }) {
    const { props } = usePage();
    const user = props.auth?.user;
    const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({ name: '' });
    const flash = props.flash || {};
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isListMounted, setIsListMounted] = useState(false);

    const permissions = Array.isArray(initialPermissions) ? initialPermissions : [];

    useEffect(() => {
        const timer = setTimeout(() => setIsListMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setIsModalOpen(false);
        reset(); 
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('permissions.store'), {
            onSuccess: () => {
                closeModal();
            },
        });
    };

    const handleDelete = (permissionId, permissionName) => {
        // Example: Prevent deletion of specific permissions if needed
        // if (DEFAULT_PERMISSION_NAMES.includes(permissionName)) {
        //     alert(`Default permission "${permissionName}" cannot be deleted.`);
        //     return;
        // }
        if (confirm(`Are you sure you want to delete the permission "${permissionName}"? This may affect roles using this permission.`)) {
            InertiaRouter.delete(route('permissions.destroy', permissionId), {
                preserveScroll: true,
            });
        }
    };
    
    const commonInputClasses = "block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md";
    const commonLabelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center";

    return (
        <AuthenticatedLayout user={user} title="Permissions">
            <Head title="Permissions" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                       <KeyRound size={30} className="mr-3 text-blue-500" /> Manage Permissions
                    </h1>
                    <button
                        onClick={openModal}
                        className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm font-medium"
                    >
                        <Plus size={18} className="mr-2 -ml-1" />
                        Add New Permission
                    </button>
                </div>

                {flash.success && (
                    <div className="mb-5 p-4 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-200 flex items-center shadow" role="alert">
                        <CheckCircle2 size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="mb-5 p-4 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-200 flex items-center shadow" role="alert">
                        <XCircle size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {permissions.length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl">
                        <div className="space-y-0">
                            {permissions.map((permission, index) => (
                                <div 
                                    key={permission.id}
                                    className={`flex items-center justify-between p-5 transition-all duration-300 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-700/50 
                                                ${index !== 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}
                                                ${isListMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
                                    style={{ animationDelay: isListMounted ? `${index * 0.07}s` : '0s' }}
                                >
                                    <div className="flex items-center min-w-0">
                                        <div className={`w-10 h-10 bg-indigo-100 dark:bg-indigo-900/70 text-indigo-600 dark:text-indigo-300 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 shadow-sm`}>
                                            <KeyRound size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 truncate" title={permission.name}>
                                                {permission.name}
                                            </h3>
                                            {/* You could add a description or guard_name here if available and relevant */}
                                            {/* <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">Guard: {permission.guard_name || 'web'}</p> */}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-shrink-0 flex items-center space-x-2.5">
                                        {/* Edit and Delete actions are typically not provided for permissions via UI if they are code-defined. */}
                                        {/* If they are database-managed and editable/deletable: */}
                                        {/* <Tippy content="Edit Permission (if applicable)">
                                            <Link href={route('permissions.edit', permission.id)} className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-300 transition-colors p-1.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-700/50">
                                                <EditIcon size={18} />
                                            </Link>
                                        </Tippy>
                                        <Tippy content="Delete Permission (if applicable)">
                                            <button onClick={() => handleDelete(permission.id, permission.name)} className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-300 transition-colors p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-700/50">
                                                <Trash2 size={18} />
                                            </button>
                                        </Tippy>
                                        */}
                                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                            (Typically code-defined)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl">
                        <KeyRound size={56} className="mx-auto mb-5 text-gray-400 dark:text-gray-500" />
                        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">No Permissions Defined</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Permissions are usually defined in code. You can add custom permissions if needed.
                        </p>
                        <button
                            onClick={openModal}
                            className="mt-6 inline-flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                        >
                            <Plus size={16} className="mr-2" /> Add New Permission
                        </button>
                    </div>
                )}

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6 sm:px-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden w-full max-w-md transform transition-all sm:my-8" onClick={e => e.stopPropagation()}>
                            <form onSubmit={submit}>
                                <div className="px-6 py-5 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                                        <Plus size={22} className="mr-3 text-blue-500"/>
                                        Add New Permission
                                    </h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div>
                                        <label htmlFor="create-permission-name" className={commonLabelClasses}>Permission Name <span className="text-red-500 ml-1">*</span></label>
                                        <input
                                            type="text"
                                            id="create-permission-name"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value.toLowerCase().replace(/\s+/g, '_'))} // Format name to snake_case
                                            className={commonInputClasses}
                                            required
                                            placeholder="e.g., view_leads or edit_settings"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use snake_case, e.g., manage_users. This is typically how permissions are named.</p>
                                        {errors.name && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.name}</div>}
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex flex-row justify-end items-center space-x-3">
                                    <button type="button" onClick={closeModal} className="flex-1 sm:flex-none sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-all duration-150 shadow-sm hover:shadow-md">
                                        <XCircle size={18} className="mr-2" /> Cancel
                                    </button>
                                    <button type="submit" className="flex-1 sm:flex-none sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 text-sm font-medium" disabled={processing}>
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : (
                                            <><Save size={18} className="mr-2" /> Create Permission</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
