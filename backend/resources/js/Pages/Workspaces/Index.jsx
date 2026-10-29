import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react'; // Added router import
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, Edit2 as EditIcon, Trash2, CheckCircle2, XCircle, Briefcase, Users, Settings, Info, Search as SearchIcon, Globe, Save } from 'lucide-react'; // Added Save icon

// Helper function to generate a placeholder icon style (similar to company/contact)
const getWorkspacePlaceholder = (name) => {
    const colors = [
        'bg-sky-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 
        'bg-fuchsia-500', 'bg-cyan-500', 'bg-lime-500', 'bg-violet-500'
    ];
    if (!name) name = "W"; 
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];
    return {
        colorClass: color,
        initial: name.charAt(0).toUpperCase()
    };
};


export default function WorkspacesIndex({ user, workspaces = [] }) { // Default workspaces to empty array
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });
    const { props } = usePage();
    const flash = props.flash || {};
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingWorkspace, setEditingWorkspace] = useState(null);
    
    // Separate form for editing
    const { data: editData, setData: setEditData, put: editPut, processing: editProcessing, errors: editErrors, reset: editReset } = useForm({
        id: '',
        name: '',
        description: '',
    });
    
    const [isListMounted, setIsListMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsListMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);


    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setIsModalOpen(false);
        reset(); // Reset form data when closing create modal
    };

    const openEditModal = (workspace) => {
        setEditingWorkspace(workspace);
        setEditData({ // Set data for the edit form
            id: workspace.id,
            name: workspace.name || '',
            description: workspace.description || '',
        });
        setIsEditModalOpen(true);
    };
    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingWorkspace(null);
        editReset(); // Reset edit form data
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('workspaces.store'), {
            onSuccess: () => {
                closeModal();
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        if (!editingWorkspace) return;
        editPut(route('workspaces.update', editingWorkspace.id), {
             onSuccess: () => {
                closeEditModal();
            },
        });
    };
    
    const handleDelete = (workspaceId, workspaceName) => {
        if (confirm(`Are you sure you want to delete the workspace "${workspaceName}"? This action cannot be undone and might affect associated data.`)) {
            router.delete(route('workspaces.destroy', workspaceId), { // Ensure router is imported from @inertiajs/react
                preserveScroll: true,
            });
        }
    };


    const commonInputClasses = "block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md";
    const commonLabelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center";


    return (
        <AuthenticatedLayout user={user} title="Workspaces">
            <Head title="Workspaces" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 w-full mx-auto"> {/* Adjusted max-width for single column */}
                <div className="mb-6 flex flex-col sm:flex-row justify-end items-end gap-4">
                 
                    <button
                        onClick={openModal}
                        className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm font-medium"
                    >
                        <Plus size={18} className="mr-2 -ml-1" />
                        Add 
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

                {/* Workspaces Card List (Single Column) */}
                {workspaces && workspaces.length > 0 ? (
                    <div className="space-y-6"> {/* Changed from grid to space-y for single column list */}
                        {workspaces.map((ws, index) => {
                             const placeholder = getWorkspacePlaceholder(ws.name);
                             return (
                            <div 
                                key={ws.id}
                                className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1 border-l-4 ${placeholder.colorClass.replace('bg-', 'border-')}
                                            ${isListMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
                                style={{ animationDelay: isListMounted ? `${index * 0.07}s` : '0s' }}
                            >
                                <div className="flex items-start sm:items-center flex-1 min-w-0 mb-4 sm:mb-0">
                                    <div className={`w-12 h-12 ${placeholder.colorClass} rounded-lg flex items-center justify-center text-white font-semibold text-xl mr-4 flex-shrink-0 shadow`}>
                                        {placeholder.initial}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate" title={ws.name}>
                                            {ws.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {ws.members_count ? `${ws.members_count} Member${ws.members_count > 1 ? 's' : ''}` : 'No members'}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-1" title={ws.description || ''}>
                                            {ws.description || <span className="italic text-gray-400 dark:text-gray-500">No description</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 flex items-center space-x-2.5 mt-3 sm:mt-0 sm:ml-4">
                                    {(user && user.id === ws.owner_id) && ( 
                                        <button onClick={() => openEditModal(ws)} className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-300 transition-colors p-1.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-700/50" title="Edit Workspace">
                                            <EditIcon size={18} />
                                        </button>
                                    )}
                                     {(user && user.id === ws.owner_id) && (
                                        <button onClick={() => handleDelete(ws.id, ws.name)} className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-300 transition-colors p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-700/50" title="Delete Workspace">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                             );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl">
                        <Globe size={56} className="mx-auto mb-5 text-gray-400 dark:text-gray-500" />
                        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">No Workspaces Found</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Get started by creating your first workspace.
                        </p>
                        <button
                            onClick={openModal}
                            className="mt-6 inline-flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                        >
                            <Plus size={16} className="mr-2" /> Add New Workspace
                        </button>
                    </div>
                )}

                {/* Modal for adding workspace */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6 sm:px-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden w-full max-w-lg transform transition-all sm:my-8" onClick={e => e.stopPropagation()}>
                            <form onSubmit={submitCreate}>
                                <div className="px-6 py-5 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                                        <Plus size={22} className="mr-3 text-blue-500"/>
                                        Create New Workspace
                                    </h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div>
                                        <label htmlFor="create-ws-name" className={commonLabelClasses}>Workspace Name <span className="text-red-500 ml-1">*</span></label>
                                        <input
                                            type="text"
                                            id="create-ws-name"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className={commonInputClasses}
                                            required
                                            placeholder="e.g., Marketing Team Q3"
                                        />
                                        {errors.name && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.name}</div>}
                                    </div>
                                    <div>
                                        <label htmlFor="create-ws-description" className={commonLabelClasses}>Description (Optional)</label>
                                        <textarea
                                            id="create-ws-description"
                                            rows="3"
                                            value={data.description}
                                            onChange={e => setData('description', e.target.value)}
                                            className={commonInputClasses}
                                            placeholder="A brief description of this workspace..."
                                        />
                                        {errors.description && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.description}</div>}
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
                                                Creating...
                                            </>
                                        ) : (
                                            <><Save size={18} className="mr-2" /> Create Workspace</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isEditModalOpen && editingWorkspace && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6 sm:px-0 bg-black/60 backdrop-blur-sm" onClick={closeEditModal}>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden w-full max-w-lg transform transition-all sm:my-8" onClick={e => e.stopPropagation()}>
                            <form onSubmit={submitEdit}>
                                <div className="px-6 py-5 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                                        <EditIcon size={22} className="mr-3 text-indigo-500"/>
                                        Edit Workspace: <span className="ml-2 font-bold truncate">{editingWorkspace.name}</span>
                                    </h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div>
                                        <label htmlFor="edit-ws-name" className={commonLabelClasses}>Workspace Name <span className="text-red-500 ml-1">*</span></label>
                                        <input
                                            type="text"
                                            id="edit-ws-name"
                                            value={editData.name}
                                            onChange={e => setEditData('name', e.target.value)}
                                            className={commonInputClasses}
                                            required
                                        />
                                        {editErrors.name && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{editErrors.name}</div>}
                                    </div>
                                    <div>
                                        <label htmlFor="edit-ws-description" className={commonLabelClasses}>Description (Optional)</label>
                                        <textarea
                                            id="edit-ws-description"
                                            rows="3"
                                            value={editData.description}
                                            onChange={e => setEditData('description', e.target.value)}
                                            className={commonInputClasses}
                                        />
                                        {editErrors.description && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{editErrors.description}</div>}
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex flex-row justify-end items-center space-x-3">
                                    <button type="button" onClick={closeEditModal} className="flex-1 sm:flex-none sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-all duration-150 shadow-sm hover:shadow-md">
                                        <XCircle size={18} className="mr-2" /> Cancel
                                    </button>
                                    <button type="submit" className="flex-1 sm:flex-none sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 text-sm font-medium" disabled={editProcessing}>
                                        {editProcessing ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Updating...
                                            </>
                                        ) : (
                                            <><Save size={18} className="mr-2" /> Update Workspace</>
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
