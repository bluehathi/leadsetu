import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Loader2, Mail, Phone, Building2, Globe } from 'lucide-react'; // Import X for close, Loader2 for processing state, Mail, Phone, Building2, Globe for input icons

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
        title: '',
        positions: '',
        tags: [],
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
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-2 py-6 sm:px-0 bg-[rgba(0,0,0,0.6)]"
        >
            {/* Modal Panel */}
            <div
                className="w-full sm:w-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 p-0 max-w-4xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Add Lead
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
                <form onSubmit={submit} className="w-full p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-10 py-2`}
                                    required
                                    disabled={processing}
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <Mail size={16} />
                                </span>
                            </div>
                            {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
                        </div>
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Email</label>
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-10 py-2`}
                                    disabled={processing}
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <Mail size={16} />
                                </span>
                            </div>
                            {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
                        </div>
                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Phone</label>
                            <div className="relative">
                                <input
                                    id="phone"
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-10 py-2`}
                                    disabled={processing}
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <Phone size={16} />
                                </span>
                            </div>
                            {errors.phone && <div className="text-xs text-red-500 mt-1">{errors.phone}</div>}
                        </div>
                        {/* Company */}
                        <div>
                            <label htmlFor="company" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Company</label>
                            <div className="relative">
                                <input
                                    id="company"
                                    type="text"
                                    value={data.company}
                                    onChange={(e) => setData('company', e.target.value)}
                                    className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-10 py-2`}
                                    disabled={processing}
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <Building2 size={16} />
                                </span>
                            </div>
                            {errors.company && <div className="text-xs text-red-500 mt-1">{errors.company}</div>}
                        </div>
                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Title</label>
                            <input
                                id="title"
                                type="text"
                                value={data.title}
                                onChange={e => setData('title', e.target.value)}
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-4 py-2"
                                disabled={processing}
                            />
                            {errors.title && <div className="text-xs text-red-500 mt-1">{errors.title}</div>}
                        </div>
                        {/* Positions */}
                        <div>
                            <label htmlFor="positions" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Positions</label>
                            <input
                                id="positions"
                                type="text"
                                value={data.positions}
                                onChange={e => setData('positions', e.target.value)}
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-4 py-2"
                                placeholder="e.g. CEO, Founder"
                                disabled={processing}
                            />
                            {errors.positions && <div className="text-xs text-red-500 mt-1">{errors.positions}</div>}
                        </div>
                        {/* Tags */}
                        <div>
                            <label htmlFor="tags" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Tags</label>
                            <input
                                id="tags"
                                type="text"
                                value={data.tags.join(', ')}
                                onChange={e => setData('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-4 py-2"
                                placeholder="e.g. SaaS, B2B, Hot Lead"
                                disabled={processing}
                            />
                            {errors.tags && <div className="text-xs text-red-500 mt-1">{errors.tags}</div>}
                        </div>
                        {/* Website */}
                        <div>
                            <label htmlFor="website" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Website</label>
                            <div className="relative">
                                <input
                                    id="website"
                                    type="url"
                                    value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                    className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-10 py-2`}
                                    disabled={processing}
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <Globe size={16} />
                                </span>
                            </div>
                            {errors.website && <div className="text-xs text-red-500 mt-1">{errors.website}</div>}
                        </div>
                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Status <span className="text-red-500">*</span></label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2`}
                                required
                                disabled={processing}
                            >
                                {statuses && statuses.map((statusOption, index) => (
                                    <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>
                                ))}
                            </select>
                            {errors.status && <div className="text-xs text-red-500 mt-1">{errors.status}</div>}
                        </div>
                        {/* Source */}
                        <div>
                            <label htmlFor="source" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Source</label>
                            <select
                                id="source"
                                value={data.source}
                                onChange={(e) => setData('source', e.target.value)}
                                className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2`}
                                disabled={processing}
                            >
                                <option value="">-- Select Source --</option>
                                {sources && sources.map((sourceOption, index) => (
                                    <option key={sourceOption.value} value={sourceOption.value}>{sourceOption.label}</option>
                                ))}
                            </select>
                            {errors.source && <div className="text-xs text-red-500 mt-1">{errors.source}</div>}
                        </div>
                    </div>
                    {/* Notes */}
                    <div className="mb-4">
                        <label htmlFor="notes" className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Notes</label>
                        <textarea
                            id="notes"
                            rows="4"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            className={`w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring focus:ring-blue-200 dark:focus:ring-blue-800 px-3 py-2 min-h-[80px]`}
                            disabled={processing}
                        ></textarea>
                        {errors.notes && <div className="text-xs text-red-500 mt-1">{errors.notes}</div>}
                    </div>
                    {/* Footer */}
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={processing}
                            className="inline-flex items-center px-5 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300 transition shadow disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition shadow disabled:opacity-60"
                        >
                            {processing ? (
                                <Loader2 size={18} className="animate-spin mr-2" />
                            ) : null}
                            {processing ? 'Saving...' : 'Save Lead'}
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
