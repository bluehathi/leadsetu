import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Logo from '@/Components/Logo';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [success, setSuccess] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onSuccess: () => {
                setSuccess(true);
                reset('password', 'password_confirmation');
            },
        });
    };

    return (
        <>
            <Head title="Register" />
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-800 dark:via-gray-900 dark:to-black p-4 font-sans">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden p-8 space-y-8">
                    <div className="text-center">
                        <Logo className="mx-auto mb-4 w-12 h-12" />
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Create an Account</h1>
                        <p className="text-gray-600 dark:text-gray-400">Sign up to start managing your leads.</p>
                    </div>
                    {success && (
                        <div className="mb-4 font-medium text-sm text-green-600 dark:text-green-400">
                            Registration successful! Please check your email to verify your account.
                        </div>
                    )}
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                            <input
                                id="name"
                                type="text"
                                name="name"
                                value={data.name}
                                className={`w-full px-4 py-3 border ${errors?.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg shadow-sm focus:outline-none focus:ring-2 ${errors?.name ? 'focus:ring-red-500' : 'focus:ring-blue-500 dark:focus:ring-blue-400'} focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition duration-200`}
                                placeholder="Your Name"
                                required
                                autoFocus
                                onChange={e => setData('name', e.target.value)}
                            />
                            {errors?.name && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
                        </div>
                        <div>
                            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className={`w-full px-4 py-3 border ${errors?.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg shadow-sm focus:outline-none focus:ring-2 ${errors?.email ? 'focus:ring-red-500' : 'focus:ring-blue-500 dark:focus:ring-blue-400'} focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition duration-200`}
                                placeholder="you@example.com"
                                required
                                autoComplete="username"
                                onChange={e => setData('email', e.target.value)}
                            />
                            {errors?.email && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
                        </div>
                        <div>
                            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className={`w-full px-4 py-3 border ${errors?.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg shadow-sm focus:outline-none focus:ring-2 ${errors?.password ? 'focus:ring-red-500' : 'focus:ring-blue-500 dark:focus:ring-blue-400'} focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition duration-200`}
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                                onChange={e => setData('password', e.target.value)}
                            />
                            {errors?.password && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
                        </div>
                        <div>
                            <label htmlFor="password_confirmation" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                            <input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className={`w-full px-4 py-3 border ${errors?.password_confirmation ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg shadow-sm focus:outline-none focus:ring-2 ${errors?.password_confirmation ? 'focus:ring-red-500' : 'focus:ring-blue-500 dark:focus:ring-blue-400'} focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition duration-200`}
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                                onChange={e => setData('password_confirmation', e.target.value)}
                            />
                            {errors?.password_confirmation && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.password_confirmation}</p>}
                        </div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition duration-150 ease-in-out"
                            disabled={processing}
                        >
                            {processing ? 'Registering...' : 'Register'}
                        </button>
                    </form>
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                        Already have an account?{' '}
                        <Link href={route('login')} className="text-blue-600 dark:text-blue-400 hover:underline">Log in</Link>
                    </p>
                </div>
            </div>
        </>
    );
}
