import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react'; // Import from @inertiajs/react
import  Logo  from '@/Components/Logo'; // Import the Logo component
// Functional component for the Login page
export default function Login({ canResetPassword, status, errors }) { // Receive props: canResetPassword, status, and errors (automatically provided by Inertia)

    // Use Inertia's useForm hook for form handling
    const { data, setData, post, processing, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    // State for managing password visibility
    const [showPassword, setShowPassword] = useState(false);

    // Function to toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Function to handle form submission
    const submit = (e) => {
        e.preventDefault(); // Prevent default form submission
        // Post the form data to the 'login' route
        post(route('login'), { // Assumes a named route 'login' exists
            onFinish: () => reset('password'), // Reset password field on finish
        });
    };

    return (
        <>
            {/* Set the page title */}
            <Head title="Log in" />

            {/* Main container with background gradient and centering */}
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-800 dark:via-gray-900 dark:to-black p-4 font-sans">

                {/* Login Card */}
                <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden p-8 space-y-8 transform transition-all hover:scale-[1.01] duration-300 ease-in-out">

                    {/* Logo or Title */}
                    <div className="text-center">
                    <Logo/>
                        <p className="text-gray-600 dark:text-gray-400">Sign in to continue to your dashboard.</p>
                    </div>

                    {/* Display session status message if present */}
                    {status && (
                        <div className="mb-4 font-medium text-sm text-green-600 dark:text-green-400">
                            {status}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={submit} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                name="email" // Name attribute is good practice
                                value={data.email} // Controlled component: value bound to state
                                className={`w-full px-4 py-3 border ${errors?.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg shadow-sm focus:outline-none focus:ring-2 ${errors?.email ? 'focus:ring-red-500' : 'focus:ring-blue-500 dark:focus:ring-blue-400'} focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition duration-200`}
                                placeholder="you@example.com"
                                required
                                autoFocus
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)} // Update state on change
                            />
                            {/* Display validation error for email */}
                            {errors?.email && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'} // Toggle type based on state
                                name="password"
                                value={data.password}
                                className={`w-full px-4 py-3 border ${errors?.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg shadow-sm focus:outline-none focus:ring-2 ${errors?.password ? 'focus:ring-red-500' : 'focus:ring-blue-500 dark:focus:ring-blue-400'} focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition duration-200`}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                            />
                             {/* Toggle Password Visibility Button */}
                             <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute inset-y-0 right-0 top-7 px-3 flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
                                aria-label="Toggle password visibility"
                            >
                                {/* Conditional rendering for eye icons */}
                                {showPassword ? (
                                    // Eye Slash Icon (Hide)
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
                                ) : (
                                    // Eye Icon (Show)
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.25a5.25 5.25 0 0 0 5.25-5.25 5.25 5.25 0 0 0-5.25-5.25 5.25 5.25 0 0 0-5.25 5.25 5.25 5.25 0 0 0 5.25 5.25Z" /> // Added closing path for eye icon
                                    </svg>
                                )}
                            </button>
                            {/* Display validation error for password */}
                            {errors?.password && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            {/* Remember Me Checkbox */}
                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    name="remember"
                                    type="checkbox"
                                    checked={data.remember} // Bind checked state
                                    onChange={(e) => setData('remember', e.target.checked)} // Update state on change
                                    className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700"
                                />
                                <label htmlFor="remember" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                    Remember me
                                </label>
                            </div>

                            {/* Forgot Password Link */}
                            {canResetPassword && ( // Conditionally render if the prop is true
                                <Link
                                    href={route('password.request')} // Use Inertia Link for navigation
                                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                                >
                                    Forgot your password?
                                </Link>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                className="cursor-pointer w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition duration-150 ease-in-out"
                                disabled={processing} // Disable button while form is processing
                            >
                                {processing ? 'Logging In...' : 'Log In'}
                            </button>
                        </div>
                    </form>

                    {/* Optional: Link to Sign Up Page */}
                    {/* <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <Link
                            href={route('register')} // Assuming you have a 'register' route
                            className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Sign up
                        </Link>
                    </p> */}

                </div>
            </div>
        </>
    );
}
