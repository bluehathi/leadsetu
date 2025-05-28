import React, { useState } from 'react';
import { Head, usePage, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CheckCircle2, XCircle, User, Lock, Save, Eye, EyeOff, Mail as MailIcon } from 'lucide-react';

export default function ProfileIndex({ user: initialUser }) { // Renamed user prop to avoid conflict with usePage().props.auth.user
    const { props } = usePage();
    const authUser = props.auth?.user; // User for AuthenticatedLayout
    const flash = props.flash || {};
    
    const [showPassword, setShowPassword] = useState(false);

    const { data: profileData, setData: setProfileData, post: postProfile, processing: profileProcessing, errors: profileErrors, recentlySuccessful: profileRecentlySuccessful, reset: resetProfileForm } = useForm({
        name: initialUser.name || '',
        email: initialUser.email || '', // Email is typically not editable or handled differently
    });

    const { data: passwordData, setData: setPasswordData, post: postPassword, processing: passwordProcessing, errors: passwordErrors, recentlySuccessful: passwordRecentlySuccessful, reset: resetPasswordForm } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    
    const commonInputClasses = "block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md";
    const commonLabelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center";


    const handleProfileSubmit = (e) => {
        e.preventDefault();
        postProfile(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                // Flash message will be handled by Inertia if backend sends it
            },
        });
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        postPassword(route('profile.password'), {
            preserveScroll: true,
            onSuccess: () => {
                resetPasswordForm(); // Clear password fields on success
            },
        });
    };

    return (
        <AuthenticatedLayout user={authUser} title="My Profile">
            <Head title="My Profile" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
               

                {flash.success && (
                    <div className="mb-5 p-4 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-200 flex items-center shadow" role="alert">
                        <CheckCircle2 size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash.error && (
                    <div className="mb-5 p-4 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-200 flex items-center shadow" role="alert">
                        <XCircle size={20} className="mr-2.5 flex-shrink-0" aria-hidden="true" />
                        <span>{flash.error || 'An unexpected error occurred.'}</span>
                    </div>
                )}
                
                {/* Profile Information Form */}
                <form 
                    onSubmit={handleProfileSubmit} 
                    className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8 space-y-6 mb-8"
                >
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                            <User size={22} className="mr-3 text-blue-500" />
                            Profile Information
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Update your account's profile information.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="profile-name" className={commonLabelClasses}>
                            Full Name <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="text"
                            id="profile-name"
                            className={commonInputClasses}
                            value={profileData.name}
                            onChange={e => setProfileData('name', e.target.value)}
                            required
                            autoComplete="name"
                            placeholder="e.g., John Doe"
                        />
                        {profileErrors.name && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{profileErrors.name}</div>}
                    </div>

                    <div>
                        <label htmlFor="profile-email" className={commonLabelClasses}>
                           <MailIcon size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Email Address (Cannot be changed)
                        </label>
                        <input
                            type="email"
                            id="profile-email"
                            className={`${commonInputClasses} bg-gray-100 dark:bg-gray-700 cursor-not-allowed`}
                            value={profileData.email}
                            disabled
                            readOnly
                            autoComplete="email"
                        />
                        {/* Email is not editable, so no error message here */}
                    </div>
                    
                    <div className="flex flex-row justify-end items-center pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
                        <button 
                            type="submit" 
                            className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 text-sm font-medium" 
                            disabled={profileProcessing}
                        >
                            {profileProcessing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} className="mr-2" />
                                    Update Profile
                                </>
                            )}
                        </button>
                    </div>
                     {profileRecentlySuccessful && !flash.success && ( // Show only if no other global flash is present
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-800/30 border border-green-200 dark:border-green-600 rounded-md text-sm text-green-600 dark:text-green-200">
                            Profile updated successfully!
                        </div>
                    )}
                </form>

                {/* Change Password Form */}
                <form 
                    onSubmit={handlePasswordSubmit} 
                    className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8 space-y-6"
                >
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                            <Lock size={22} className="mr-3 text-blue-500" />
                            Change Password
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Ensure your account is using a long, random password to stay secure.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="current_password" className={commonLabelClasses}>Current Password <span className="text-red-500 ml-1">*</span></label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="current_password"
                                className={commonInputClasses}
                                value={passwordData.current_password}
                                onChange={e => setPasswordData('current_password', e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {passwordErrors.current_password && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{passwordErrors.current_password}</div>}
                    </div>
                     <div>
                        <label htmlFor="new_password" className={commonLabelClasses}>New Password <span className="text-red-500 ml-1">*</span></label>
                         <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="new_password"
                                className={commonInputClasses}
                                value={passwordData.password}
                                onChange={e => setPasswordData('password', e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                             <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {passwordErrors.password && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{passwordErrors.password}</div>}
                    </div>
                     <div>
                        <label htmlFor="confirm_password" className={commonLabelClasses}>Confirm New Password <span className="text-red-500 ml-1">*</span></label>
                         <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="confirm_password"
                                className={commonInputClasses}
                                value={passwordData.password_confirmation}
                                onChange={e => setPasswordData('password_confirmation', e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {passwordErrors.password_confirmation && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{passwordErrors.password_confirmation}</div>}
                    </div>
                    <div className="flex items-center mt-4">
                        <input
                            type="checkbox"
                            id="show_password_toggle"
                            checked={showPassword}
                            onChange={() => setShowPassword(!showPassword)}
                            className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700"
                        />
                        <label htmlFor="show_password_toggle" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Show Passwords
                        </label>
                    </div>

                    <div className="flex flex-row justify-end items-center pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
                        <button 
                            type="submit" 
                            className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 text-sm font-medium" 
                            disabled={passwordProcessing}
                        >
                             {passwordProcessing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save size={18} className="mr-2" />
                                    Change Password
                                </>
                            )}
                        </button>
                    </div>
                     {passwordRecentlySuccessful && !flash.success && ( // Show only if no other global flash is present
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-800/30 border border-green-200 dark:border-green-600 rounded-md text-sm text-green-600 dark:text-green-200">
                            Password updated successfully!
                        </div>
                    )}
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
