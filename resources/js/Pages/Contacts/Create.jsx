import React from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function Create({}) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        title: '',
        notes: '',
    });

    const { props } = usePage();
    const flash = props.flash || {};
    const companies = props.companies || [];

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('contacts.store'));
    };

    return (
        <AuthenticatedLayout user={props.auth?.user} title="Add Contact">
            <Head title="Create Contact" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 mx-auto w-full">

                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Add Contact</h1>
                    <Link href={route('contacts.index')} className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500">Back</Link>
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
                        <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" required placeholder="John Doe"/>
                        {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                    </div>

                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="john.doe@example.com"/>
                        {errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
                    </div>

                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                        <input type="text" value={data.phone} onChange={e => setData('phone', e.target.value)} className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="(123) 456-7890"/>
                        {errors.phone && <div className="text-red-500 text-sm mt-1">{errors.phone}</div>}
                    </div>


                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                        <input type="text" value={data.title} onChange={e => setData('title', e.target.value)} className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Software Engineer"/>
                        {errors.title && <div className="text-red-500 text-sm mt-1">{errors.title}</div>}
                    </div>

                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                        <textarea value={data.notes} onChange={e => setData('notes', e.target.value)} className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
                        {errors.notes && <div className="text-red-500 text-sm mt-1" placeholder="Met at conference...">{errors.notes}</div>}
                    </div>

                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                        <select value={data.company_id || ''} onChange={e => setData('company_id', e.target.value)} className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="">Select a company</option>
                            {companies.map(company => (
                                <option key={company.id} value={company.id}>{company.name}</option>
                            ))}
                        </select>
                        {errors.company_id && <div className="text-red-500 text-sm mt-1">{errors.company_id}</div>}
                    </div>

                    <div className="flex justify-end space-x-2 mt-6">
                        <button type="submit" className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition ease-in-out duration-150" disabled={processing}>{processing ? 'Creating...' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}