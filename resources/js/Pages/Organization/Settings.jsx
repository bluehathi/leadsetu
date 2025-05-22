import React, { useRef } from 'react';
import { Head, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/parts/Sidebar';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function OrganizationSettings({ organization }) {
    // Defensive: fallback to empty object if organization is null/undefined
    organization = organization || {};
    const logoInput = useRef();
    const { props } = usePage();
    const flash = props.flash || {};
    const [data, setData] = React.useState({
        name: organization.name || '',
        contact_email: organization.contact_email || '',
        contact_phone: organization.contact_phone || '',
        address: organization.address || '',
        logo: null,
    });
    const [processing, setProcessing] = React.useState(false);
    const [errors, setErrors] = React.useState({});

    const inputClass =
        'mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition';
    const buttonClass =
        'inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('contact_email', data.contact_email);
        formData.append('contact_phone', data.contact_phone);
        formData.append('address', data.address);
        if (data.logo) formData.append('logo', data.logo);
        await window.axios.post(route('organization.settings.update'), formData)
            .then(() => window.Inertia.visit(window.location.href, { only: ['flash'] }))
            .catch(err => setErrors(err.response?.data?.errors || {}))
            .finally(() => setProcessing(false));
    };

    return (
        <>
            <Head title="Organization Settings" />
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
                <Sidebar user={organization.user} />
                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    <main className="flex-1 relative overflow-y-auto focus:outline-none">
                        <div className="py-8 px-4 sm:px-6 lg:px-8">
                            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                                    Organization Settings
                                </h1>
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
                            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden p-6">
                                <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
                                    <div>
                                        <label className="block font-medium text-gray-700 dark:text-gray-200">Organization Name</label>
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={data.name}
                                            onChange={e => setData({ ...data, name: e.target.value })}
                                        />
                                        {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                                    </div>
                                    <div>
                                        <label className="block font-medium text-gray-700 dark:text-gray-200">Contact Email</label>
                                        <input
                                            type="email"
                                            className={inputClass}
                                            value={data.contact_email}
                                            onChange={e => setData({ ...data, contact_email: e.target.value })}
                                        />
                                        {errors.contact_email && <div className="text-red-500 text-sm mt-1">{errors.contact_email}</div>}
                                    </div>
                                    <div>
                                        <label className="block font-medium text-gray-700 dark:text-gray-200">Contact Phone</label>
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={data.contact_phone}
                                            onChange={e => setData({ ...data, contact_phone: e.target.value })}
                                        />
                                        {errors.contact_phone && <div className="text-red-500 text-sm mt-1">{errors.contact_phone}</div>}
                                    </div>
                                    <div>
                                        <label className="block font-medium text-gray-700 dark:text-gray-200">Address</label>
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={data.address}
                                            onChange={e => setData({ ...data, address: e.target.value })}
                                        />
                                        {errors.address && <div className="text-red-500 text-sm mt-1">{errors.address}</div>}
                                    </div>
                                    <div>
                                        <label className="block font-medium text-gray-700 dark:text-gray-200">Logo</label>
                                        <input
                                            type="file"
                                            className={inputClass}
                                            ref={logoInput}
                                            onChange={e => setData({ ...data, logo: e.target.files[0] })}
                                            accept="image/*"
                                        />
                                        {organization.logo && (
                                            <div className="mt-2">
                                                <img src={organization.logo.startsWith('http') ? organization.logo : `/storage/${organization.logo}`} alt="Logo" className="h-16" />
                                            </div>
                                        )}
                                        {errors.logo && <div className="text-red-500 text-sm mt-1">{errors.logo}</div>}
                                    </div>
                                    <button type="submit" className={buttonClass} disabled={processing}>Update Settings</button>
                                </form>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
