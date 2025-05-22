import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
// Import desired icons from lucide-react
import { Plus, Eye, Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react'; // Added CheckCircle2, XCircle for flash
import Sidebar from '@/Components/parts/Sidebar'; // Adjust path if needed
import AddLeadModal from '@/Components/leads/AddLeadModal'; // Import the modal component
import Pagination from '@/Components/Pagination'; // Import the Pagination component

// Assuming you might refactor Dashboard into a layout component:
// import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'; // Example import


// Leads Index Page Component
// Receives 'auth' (containing user), 'leads' (Laravel Paginator instance), and 'flash' messages as props
export default function LeadsIndex({ user, leads }) {

    // --- Get Flash Messages ---
    // Use the usePage hook to access shared props, including flash messages
    const { props } = usePage();
    const flash = props.flash || {}; // Get flash object, default to empty object if not present

    // --- Modal State ---
    const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
    const openModal = () => setIsModalOpen(true);        // Function to open the modal
    const closeModal = () => setIsModalOpen(false);       // Function to close the modal

    // --- Status/Method Options (These should ideally come from props passed by the controller) ---
    const leadStatusOptions = props.statusOptions || [ // Example fallback
        { value: 'new', label: 'New Lead' },
        { value: 'contacted', label: 'Contacted' },
        { value: 'qualified', label: 'Qualified' },
        { value: 'unqualified', label: 'Unqualified' },
        { value: 'lost', label: 'Lost Deal' },
        { value: 'won', label: 'Won Deal' }
    ];
    const leadMethodOptions = props.methodOptions || [ // Example fallback
        { value: 'website', label: 'Website Form' },
        { value: 'referral', label: 'Referral' },
        { value: 'cold_call', label: 'Cold Call' },
        { value: 'advertisement', label: 'Advertisement' },
        { value: 'other', label: 'Other' },
    ];
    // --- End Status/Method Options ---

    return (
        // If using a separate Layout component, remove the outer div and Sidebar,
        // and wrap the content with <AuthenticatedLayout user={auth.user}> ... </AuthenticatedLayout>
        <>
            <Head title="Leads" />

             {/* Main Flex Container including Sidebar */}
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">

                {/* Sidebar */}
                {/* Ensure 'auth.user' object is passed */}
                <Sidebar user={user} />

                {/* Main Content Area */}
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    {/* Optional Header for mobile (if not handled by layout) */}
                    {/* Example: <header className="md:hidden ..."> ... </header> */}

                    {/* Scrollable Content Area */}
                    <main className="flex-1 relative overflow-y-auto focus:outline-none">
                        <div className="py-8 px-4 sm:px-6 lg:px-8">

                            {/* Page Header */}
                            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                                    Manage Leads
                                </h1>
                                <button
                                    onClick={openModal} // Opens the AddLeadModal
                                    className="inline-flex cursor-pointer items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                                >
                                    <Plus size={18} className="mr-2 -ml-1" />
                                    Add New Lead
                                </button>
                            </div>

                             {/* Flash Message Display */}
                            {flash.success && (
                                <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 rounded-md flex items-center justify-between" role="alert">
                                   <div className="flex items-center">
                                     <CheckCircle2 size={20} className="mr-2 flex-shrink-0" aria-hidden="true" />
                                     <span>{flash.success}</span>
                                   </div>
                                
                                </div>
                            )}
                             {/* Display error flash messages if they exist */}
                             {flash.error && (
                                <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md flex items-center justify-between" role="alert">
                                   <div className="flex items-center">
                                     <XCircle size={20} className="mr-2 flex-shrink-0" aria-hidden="true" />
                                     <span>{flash.error}</span>
                                   </div>
                                </div>
                            )}

                            {/* Leads Table Container */}
                            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        {/* Table Head */}
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Added On</th>
                                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        {/* Table Body */}
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {/* Check if leads.data exists and has items */}
                                            {leads && leads.data && leads.data.length > 0 ? (
                                                leads.data.map((lead) => ( // Map over the leads data array
                                                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                                                        {/* Name & Email Cell */}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{lead.name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{lead.email || '-'}</div>
                                                        </td>
                                                        {/* Company Cell */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{lead.company || '-'}</td>
                                                        {/* Status Cell */}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                // Dynamically set background and text color based on status value
                                                                lead.status === 'new' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                                lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                                lead.status === 'qualified' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                                lead.status === 'won' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                                                lead.status === 'lost' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' // Default style
                                                            }`}>
                                                                {/* Display the label corresponding to the status value */}
                                                                {leadStatusOptions.find(s => s.value === lead.status)?.label || lead.status}
                                                            </span>
                                                        </td>
                                                        {/* Added On Cell */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                            {/* Format the date */}
                                                            {new Date(lead.created_at).toLocaleDateString()}
                                                        </td>
                                                        {/* Actions Cell */}
                                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                            <div className="flex items-center justify-center space-x-2">
                                                                {/* View Action */}
                                                                <Link href={route('leads.show', lead.id)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" title="View">
                                                                    <Eye size={16} />
                                                                </Link>
                                                                {/* Edit Action */}
                                                                <Link href={route('leads.edit', lead.id)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300" title="Edit">
                                                                    <Pencil size={16} />
                                                                </Link>
                                                                {/* Delete Action */}
                                                                <Link
                                                                    href={route('leads.destroy', lead.id)}
                                                                    method="delete"
                                                                    as="button"
                                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                    title="Delete"
                                                                    // Add confirmation dialog before deleting
                                                                    onBefore={() => confirm('Are you sure you want to delete this lead?')}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                // Row shown if no leads are found
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                                        No leads found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                 {/* --- Pagination --- */}
                                 {/* Render pagination links if leads data exists and has links */}
                                 {leads && leads.links && leads.data.length > 0 && (
                                     <Pagination links={leads.links} /> // Pass the links array
                                 )}
                                 {/* --- End Pagination --- */}
                            </div>
                        </div>
                    </main>
                     {/* Optional Footer (if not handled by layout) */}
                    {/* <footer className="..."> ... </footer> */}
                </div>
            </div>

             {/* Render the modal conditionally */}
             <AddLeadModal
                show={isModalOpen}
                onClose={closeModal}
                statuses={leadStatusOptions} // Pass status options
                methods={leadMethodOptions} // Pass method options
            />
        </>
        // </AuthenticatedLayout> // Close layout component if used
    );
}
