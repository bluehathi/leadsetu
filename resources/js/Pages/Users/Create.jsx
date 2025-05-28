import React, { useState } from 'react';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Plus, CheckCircle2, XCircle, User as UserIcon, Mail, Lock, ShieldCheck, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function UsersCreate({ roles: allRoles = [] , user}) { // Default roles to empty array
    const { props } = usePage();
    const authUser = user; // User for AuthenticatedLayout
    const flash = props.flash || {};

    const { data, setData, post, processing, errors, recentlySuccessful, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '', 
        roles: '', // Changed to empty string for single role ID
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Ensure 'roles' is sent as an array with a single ID, or adjust backend to accept single ID
        const dataToSend = {
            ...data,
            roles: data.roles ? [data.roles] : [], // Send as array even if single, or adjust backend
        };
        post(route('users.store'), {
            data: dataToSend, // Send modified data
            preserveScroll: true,
            onSuccess: () => {
                reset(); 
            }
        });
    };

    const handleRoleChange = (roleId) => {
        setData('roles', roleId); // Set single role ID
    };
    
    const commonInputClasses = "block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md";
    const commonLabelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center";

    return (
        <AuthenticatedLayout user={authUser} title="Add New User">
            <Head title="Add User" />
            <div className="py-8 px-4 sm:px-6 lg:px-8  w-full mx-auto">

                <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                   
                    <Link 
                        href={route('users.index')} 
                        className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors self-end sm:self-center"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Users
                    </Link>
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
                        <span>{flash.error || 'An unexpected error occurred.'}</span>
                    </div>
                )}
                 {errors && Object.keys(errors).length > 0 && (
                    <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 rounded-lg text-sm" role="alert">
                        <p className="font-medium mb-1">Please correct the following errors:</p>
                        <ul className="list-disc list-inside">
                            {Object.entries(errors).map(([field, message]) => message ? <li key={field}>{message}</li> : null)}
                        </ul>
                    </div>
                )}


                <form 
                    onSubmit={handleSubmit} 
                    className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8 space-y-6"
                >
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                            <UserIcon size={22} className="mr-3 text-blue-500" />
                            User Details
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Provide the user's information and assign roles.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="name" className={commonLabelClasses}>
                            <UserIcon size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Full Name <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="name"
                            value={data.name} 
                            onChange={e => setData('name', e.target.value)} 
                            className={commonInputClasses} 
                            required 
                            placeholder="e.g., John Doe"
                        />
                        {errors.name && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.name}</div>}
                    </div>

                    <div>
                        <label htmlFor="email" className={commonLabelClasses}>
                            <Mail size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Email Address <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input 
                            type="email" 
                            id="email"
                            value={data.email} 
                            onChange={e => setData('email', e.target.value)} 
                            className={commonInputClasses} 
                            required 
                            placeholder="e.g., john.doe@example.com"
                        />
                        {errors.email && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.email}</div>}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="password" className={commonLabelClasses}>
                                <Lock size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Password <span className="text-red-500 ml-1">*</span>
                            </label>
                             <div className="relative">
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    id="password"
                                    value={data.password} 
                                    onChange={e => setData('password', e.target.value)} 
                                    className={commonInputClasses} 
                                    required 
                                    autoComplete="new-password"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.password}</div>}
                        </div>
                        <div>
                            <label htmlFor="password_confirmation" className={commonLabelClasses}>
                                <Lock size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Confirm Password <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <input 
                                    type={showConfirmPassword ? 'text' : 'password'} 
                                    id="password_confirmation"
                                    value={data.password_confirmation} 
                                    onChange={e => setData('password_confirmation', e.target.value)} 
                                    className={commonInputClasses} 
                                    required 
                                    autoComplete="new-password"
                                />
                                 <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={`${commonLabelClasses} mb-2`}>
                           <ShieldCheck size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Assign Role <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="space-y-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-700/30">
                            {allRoles.length > 0 ? allRoles.map(role => (
                                <label key={role.id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer">
                                    <input 
                                        type="radio" // Changed to radio
                                        name="role" // Added name attribute for radio group
                                        value={role.id}
                                        checked={data.roles === role.id} // Compare with single role ID
                                        onChange={() => handleRoleChange(role.id)}
                                        className="form-radio h-5 w-5 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-500 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-600 dark:checked:bg-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-200">{role.name}</span>
                                </label>
                            )) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No roles available.</p>
                            )}
                        </div>
                        {errors.roles && <div className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.roles}</div>}
                    </div>

                    <div className="flex flex-row justify-end items-center space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-2">
                        <Link 
                            href={route('users.index')} 
                            className="flex-1 sm:flex-none sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-all duration-150 shadow-sm hover:shadow-md"
                        >
                            <XCircle size={18} className="mr-2" />
                            Cancel
                        </Link>
                        <button 
                            type="submit" 
                            className="flex-1 sm:flex-none sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 text-sm font-medium" 
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save size={18} className="mr-2" />
                                    Create User
                                </>
                            )}
                        </button>
                    </div>
                    {recentlySuccessful && (
                        <div className="mt-4 p-3 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-md text-sm text-green-700 dark:text-green-200">
                            User created successfully!
                        </div>
                    )}
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
