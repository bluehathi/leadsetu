import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Loader2 } from 'lucide-react'; // Import X for close, Loader2 for processing state

/**
 * Default status options as objects.
 */
const defaultStatuses = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'unqualified', label: 'Unqualified' },
    { value: 'lost', label: 'Lost' },
    { value: 'won', label: 'Won' },
];

/**
 * Default source options as objects (Placeholder - provide actual options via props).
 */
const defaultSources = [
    { value: 'website', label: 'Website Form' },
    { value: 'referral', label: 'Referral' },
    { value: 'cold_call', label: 'Cold Call' },
    { value: 'advertisement', label: 'Advertisement' },
    { value: 'other', label: 'Other' },
];


/**
 * Modal component for adding a new lead.
 *
 * @param {object} props
 * @param {boolean} props.show - Controls whether the modal is visible.
 * @param {function} props.onClose - Function to call when the modal should be closed.
 * @param {Array<{value: string, label: string}>} [props.statuses=defaultStatuses] - Optional array of lead status objects.
 * @param {Array<{value: string, label: string}>} [props.sources=defaultSources] - Optional array of lead source objects.
 * @returns {JSX.Element|null} The modal component or null if not shown.
 */
export default function AddLeadModal({
    show,
    onClose,
    statuses = defaultStatuses,
    sources = defaultSources // Added sources prop
}) {
    // Inertia form helper - Added website and source
    const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        website: '', // Added website field
        status: statuses.length > 0 ? statuses[0].value : '',
        source: sources.length > 0 ? sources[0].value : '', // Added source field, initialized
        notes: '',
    });

    // Reset form fields when the modal is closed or after successful submission
    useEffect(() => {
        if (!show || recentlySuccessful) {
            const timer = setTimeout(() => {
                reset();
                 // Ensure status and source reset to their default values
                setData('status', statuses.length > 0 ? statuses[0].value : '');
                setData('source', sources.length > 0 ? sources[0].value : ''); // Reset source
            }, recentlySuccessful ? 150 : 0);
             return () => clearTimeout(timer);
        }
    // Updated dependencies
    }, [show, recentlySuccessful, reset, statuses, sources, setData]);

    // Handle form submission
    const submit = (e) => {
        e.preventDefault();
        post(route('leads.store'), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
            onError: () => {
                // Handle error if needed
            },
        });
    };

    // Handle closing the modal via buttons
    const handleClose = () => {
        if (!processing) {
            onClose();
        }
    };

    // Prevent rendering if show is false
    if (!show) {
        return null;
    }

    return (
        // Modal Overlay
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6 sm:px-0 bg-[rgba(0,0,0,0.6)]"
        >
            {/* Modal Panel */}
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden w-full max-w-2xl transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Add New Lead
                    </h3>
                    <button
                        onClick={handleClose}
                        disabled={processing}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body - Form */}
                <form onSubmit={submit}>
                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        {/* Grid container */}
                        {/* Changed to 3 columns on medium+ screens */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            {/* Name - Span 3 cols on small, 2 on medium+ */}
                            <div className="md:col-span-4">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name <span className="text-red-500">*</span></label>
                                <input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.name ? 'focus:ring-red-500' : 'focus:ring-blue-500 dark:focus:ring-blue-400'} focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition duration-150`}
                                    required
                                    disabled={processing}
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
                            </div>

                             {/* Phone */}
                             <div className="md:col-span-2">
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.phone ? 'focus:ring-red-500' : 'focus:ring-blue-500 dark:focus:ring-blue-400'} focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition duration-150`}
                                    disabled={processing}
                                />
                                {errors.phone && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.phone}</p>}
                            </div>

                            {/* Email */}
                            <div className="md:col-span-2">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.email ? 'focus:ring-red-500' : 'focus:ring-blue-500 dark:focus:ring-blue-400'} focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition duration-150`}
                                    disabled={processing}
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
                            </div>

                            {/* Company */}
                            <div className="md:col-span-4">
                                <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                                <input
                                    id="company"
                                    type="text"
                                    value={data.company}
                                    onChange={(e) => setData('company', e.target.value)}
                                    className={`w-full px-3 py-2 border ${errors.company ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.company ? 'focus:ring-red-500' : 'focus:ring-blue-500 dark:focus:ring-blue-400'} focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition duration-150`}
                                    disabled={processing}
                                />
                                {errors.company && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.company}</p>}
                            </div>

                            {/* Website */}
                            <div className="md:col-span-2">
                                <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                                <input
                                    id="website"
                                    type="url" // Use 'url' type for better semantics/validation
                                    value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                    placeholder="https://example.com"
                                    className={`w-full px-3 py-2 border ${errors.website ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.website ? 'focus:ring-red-500' : 'focus:ring-blue-500 dark:focus:ring-blue-400'} focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition duration-150`}
                                    disabled={processing}
                                />
                                {errors.website && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.website}</p>}
                            </div>

                             {/* Status */}
                             <div className="md:col-span-1">
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status <span className="text-red-500">*</span></label>
                                <select
                                    id="status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className={`w-full px-3 py-2 border ${errors.status ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.status ? 'focus:ring-red-500' : 'focus:ring-blue-500 dark:focus:ring-blue-400'} focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition duration-150 appearance-none`}
                                    required
                                    disabled={processing}
                                >
                                    {statuses && statuses.map((statusOption, index) => {
                                        if (!statusOption || typeof statusOption.value === 'undefined' || typeof statusOption.label === 'undefined') {
                                             console.warn('Invalid status option found at index:', index, statusOption);
                                             return null;
                                        }
                                        const key = `status-${String(statusOption.value)}`; // Prefix key for potential conflicts
                                        return (
                                            <option key={key} value={statusOption.value}>
                                                {statusOption.label}
                                            </option>
                                        );
                                    })}
                                </select>
                                {errors.status && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.status}</p>}
                            </div>

                             {/* source */}
                             <div className="md:col-span-1">
                                <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
                                <select
                                    id="source"
                                    value={data.source}
                                    onChange={(e) => setData('source', e.target.value)}
                                    className={`w-full px-3 py-2 border ${errors.source ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.source ? 'focus:ring-red-500' : 'focus:ring-blue-500 dark:focus:ring-blue-400'} focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition duration-150 appearance-none`}
                                    disabled={processing}
                                    // Removed 'required' assuming source might be optional
                                >
                                     {/* Add a default placeholder option if source is optional */}
                                     <option value="">-- Select Source --</option>
                                     {sources && sources.map((sourceOption, index) => {
                                        if (!sourceOption || typeof sourceOption.value === 'undefined' || typeof sourceOption.label === 'undefined') {
                                             console.warn('Invalid source option found at index:', index, sourceOption);
                                             return null;
                                        }
                                        const key = `source-${String(sourceOption.value)}`; // Prefix key
                                        return (
                                            <option key={key} value={sourceOption.value}>
                                                {sourceOption.label}
                                            </option>
                                        );
                                    })}
                                </select>
                                {errors.source && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.source}</p>}
                            </div>

                        </div> {/* End of grid container */}

                         {/* Notes (Below the grid) */}
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                            <textarea
                                id="notes"
                                rows="4"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className={`w-full px-3 py-2 border ${errors.notes ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.notes ? 'focus:ring-red-500' : 'focus:ring-blue-500 dark:focus:ring-blue-400'} focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition duration-150 resize-vertical`}
                                disabled={processing}
                            ></textarea>
                            {errors.notes && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.notes}</p>}
                        </div>
                    </div>

                    {/* Modal Footer - Actions */}
                    <div className="flex justify-end items-center p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg space-x-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={processing}
                            className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition ease-in-out duration-150"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition ease-in-out duration-150"
                        >
                            {processing ? (
                                <>
                                    <Loader2 size={18} className="animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                'Save Lead'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- How to use it in LeadsIndex.jsx ---
/*
import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import AddLeadModal from '@/Components/AddLeadModal'; // Import the modal

// Example statuses to pass from parent (could come from backend props)
const leadStatusOptions = [
    { value: 'new', label: 'New Lead' },
    { value: 'contacted', label: 'Contacted' },
    // ... other statuses
];

// Example sources to pass from parent (could come from backend props)
const leadsourceOptions = [
    { value: 'website', label: 'Website Form' },
    { value: 'referral', label: 'Referral' },
    // ... other sources
];


export default function LeadsIndex({ auth, leads }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        // <AuthenticatedLayout user={auth.user}>
        <>
            <Head title="Leads" />

            <div className="mb-6 flex ... justify-between ...">
                <h1>Manage Leads</h1>
                <button
                    onClick={openModal}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 ... text-white ..."
                >
                    <Plus size={18} className="mr-2 -ml-1" />
                    Add New Lead
                </button>
            </div>

            // ... (rest of the table code) ...

            // Pass the arrays of status and source objects to the modal
            <AddLeadModal
                show={isModalOpen}
                onClose={closeModal}
                statuses={leadStatusOptions} // Pass statuses
                sources={leadsourceOptions} // Pass sources
            />
        </>
        // </AuthenticatedLayout>
    );
}
*/
