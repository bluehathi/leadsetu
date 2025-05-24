import React from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import CompanyLayout from './_CompanyLayout';

export default function CompaniesCreate() {
    const { props } = usePage();
    const user = props.auth?.user;
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        website: '',
    });

    const submit = e => {
        e.preventDefault();
        post(route('companies.store'));
    };

    return (
        <CompanyLayout user={user} title="Add Company">
            <h1 className="text-2xl font-bold mb-6">Add Company</h1>
            <form onSubmit={submit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-4">
                <div>
                    <label className="block mb-1 font-medium">Name</label>
                    <input type="text" className="w-full border px-3 py-2 rounded" value={data.name} onChange={e => setData('name', e.target.value)} required />
                    {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                </div>
                <div>
                    <label className="block mb-1 font-medium">Description</label>
                    <input type="text" className="w-full border px-3 py-2 rounded" value={data.description} onChange={e => setData('description', e.target.value)} />
                    {errors.description && <div className="text-red-500 text-xs mt-1">{errors.description}</div>}
                </div>
                <div>
                    <label className="block mb-1 font-medium">Website</label>
                    <input type="url" className="w-full border px-3 py-2 rounded" value={data.website} onChange={e => setData('website', e.target.value)} />
                    {errors.website && <div className="text-red-500 text-xs mt-1">{errors.website}</div>}
                </div>
                <div className="flex justify-end space-x-2">
                    <Link href={route('companies.index')} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</Link>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={processing}>{processing ? 'Saving...' : 'Save'}</button>
                </div>
            </form>
        </CompanyLayout>
    );
}
