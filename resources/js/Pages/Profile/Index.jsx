import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function ProfileIndex({ user }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const [showPassword, setShowPassword] = useState(false);
    const [data, setData] = useState({
        name: user.name || '',
        email: user.email || '',
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const inputClass =
        'mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition';

    const buttonClass =
        'inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150';

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        await window.axios.post(route('profile.update'), data)
            .then((res) => {
                if (res.data && res.data.success) {
                    window.Inertia.visit(window.location.href, { only: ['flash'] });
                } else {
                    window.location.reload();
                }
            })
            .catch(err => setErrors(err.response?.data?.errors || {}))
            .finally(() => setProcessing(false));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        await window.axios.post(route('profile.password'), passwordData)
            .then((res) => {
                if (res.data && res.data.success) {
                    window.Inertia.visit(window.location.href, { only: ['flash'] });
                }
                setPasswordData({ current_password: '', password: '', password_confirmation: '' });
            })
            .catch(err => setErrors(err.response?.data?.errors || {}))
            .finally(() => setProcessing(false));
    };

    return (
        <AuthenticatedLayout user={props.auth?.user} title="My Profile">
            <Head title="My Profile" />
            <main className="flex-1 relative overflow-y-auto focus:outline-none">
                <div className="py-8 px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                            My Profile
                        </h1>
                    </div>
                    {props.flash && props.flash.success && (
                        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 rounded-md flex items-center justify-between" role="alert">
                            <div className="flex items-center">
                                <CheckCircle2 size={20} className="mr-2 flex-shrink-0" aria-hidden="true" />
                                <span>{props.flash.success}</span>
                            </div>
                        </div>
                    )}
                    {props.flash && props.flash.error && (
                        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md flex items-center justify-between" role="alert">
                            <div className="flex items-center">
                                <XCircle size={20} className="mr-2 flex-shrink-0" aria-hidden="true" />
                                <span>{props.flash.error}</span>
                            </div>
                        </div>
                    )}
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden p-6 mb-8">
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div>
                                <label className="block font-medium text-gray-700 dark:text-gray-200">Name</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={data.name}
                                    onChange={e => setData({ ...data, name: e.target.value })}
                                    autoComplete="name"
                                />
                                {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700 dark:text-gray-200">Email</label>
                                <input
                                    type="email"
                                    className={inputClass + ' bg-gray-100 dark:bg-gray-700 cursor-not-allowed'}
                                    value={data.email}
                                    disabled
                                    readOnly
                                    autoComplete="email"
                                />
                                {/* Email is not editable, so no error message here */}
                            </div>
                            <button type="submit" className={buttonClass} disabled={processing}>Update Profile</button>
                        </form>
                    </div>
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden p-6">
                        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Change Password</h3>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block font-medium text-gray-700 dark:text-gray-200">Current Password</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className={inputClass}
                                    value={passwordData.current_password}
                                    onChange={e => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                    autoComplete="current-password"
                                />
                                {errors.current_password && <div className="text-red-500 text-sm mt-1">{errors.current_password}</div>}
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700 dark:text-gray-200">New Password</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className={inputClass}
                                    value={passwordData.password}
                                    onChange={e => setPasswordData({ ...passwordData, password: e.target.value })}
                                    autoComplete="new-password"
                                />
                                {errors.password && <div className="text-red-500 text-sm mt-1">{errors.password}</div>}
                            </div>
                            <div>
                                <label className="block font-medium text-gray-700 dark:text-gray-200">Confirm New Password</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className={inputClass}
                                    value={passwordData.password_confirmation}
                                    onChange={e => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                                    autoComplete="new-password"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={showPassword}
                                    onChange={() => setShowPassword(!showPassword)}
                                    className="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 shadow-sm focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <span className="text-gray-700 dark:text-gray-200">Show Passwords</span>
                            </div>
                            <button type="submit" className={buttonClass} disabled={processing}>Change Password</button>
                        </form>
                    </div>
                </div>
            </main>
        </AuthenticatedLayout>
    );
}
