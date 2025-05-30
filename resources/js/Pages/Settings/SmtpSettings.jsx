import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Settings, Save, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';




export default function SmtpSettings() {
    const { props } = usePage();
    const user = props.auth?.user;
    const flash = props.flash || {};
    const config = props.smtpConfig || {};

    const { data, setData, post, processing, errors, reset } = useForm({
        driver: config.driver || 'smtp',
        host: config.host || '',
        port: config.port || '587',
        username: config.username || '',
        password: '', // Always empty for security
        encryption: config.encryption || 'tls',
        from_address: config.from_address || '',
        from_name: config.from_name || '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testStatus, setTestStatus] = useState(null);
    const [testLoading, setTestLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(name, value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.smtp.save'), {
            preserveScroll: true,
            onSuccess: () => {
                reset('password');
            }
        });
    };

    const handleTestSmtp = async (e) => {
        e.preventDefault();
        setTestStatus(null);
        setTestLoading(true);
        try {
            const response = await fetch(route('settings.smtp.test'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    to: testEmail,
                }),
            });
            const result = await response.json();
            if (response.ok && result.success) {
                setTestStatus({ type: 'success', message: result.success });
            } else {
                setTestStatus({ type: 'error', message: result.error || 'Failed to send test email.' });
            }
        } catch (err) {
            setTestStatus({ type: 'error', message: 'Failed to send test email.' });
        } finally {
            setTestLoading(false);
        }
    };

    const inputClasses = "mt-1 block w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
    const primaryButtonClasses = "inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed";
    const secondaryButtonClasses = "inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all duration-150 shadow-sm hover:shadow-md";


    return (
        <AuthenticatedLayout
            user={user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight flex items-center">
                    <Settings className="mr-2.5 h-5 w-5" /> SMTP Configuration
                </h2>
            }
            title="SMTP Settings"
        >
            <Head title="SMTP Settings" />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="w-full mx-auto">
                    {flash.success && (
                        <div className="mb-5 p-4 bg-green-100 dark:bg-green-700/30 border border-green-300 dark:border-green-600 rounded-lg text-sm text-green-700 dark:text-green-200 flex items-center shadow" role="alert">
                            <CheckCircle2 size={20} className="mr-2.5 flex-shrink-0" />
                            <span>{flash.success}</span>
                        </div>
                    )}
                    {flash.error && (
                        <div className="mb-5 p-4 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-200 flex items-center shadow" role="alert">
                            <XCircle size={20} className="mr-2.5 flex-shrink-0" />
                            <span>{flash.error}</span>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden my-6">
                        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mail Server Settings</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Configure the SMTP settings for your workspace. This will be used to send emails like lead notifications and marketing campaigns.
                            </p>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label htmlFor="driver" className={labelClasses}>Mail Driver</label>
                                    <select 
                                        id="driver" 
                                        name="driver" 
                                        value={data.driver} 
                                        onChange={handleChange} 
                                        className={inputClasses}
                                    >
                                        <option value="smtp">SMTP</option>
                                        {/* <option value="sendmail">Sendmail</option> */}
                                    </select>
                                    {errors.driver && <p className="text-xs text-red-500 mt-1.5">{errors.driver}</p>}
                                </div>

                                <div>
                                    <label htmlFor="host" className={labelClasses}>SMTP Host</label>
                                    <input
                                        id="host"
                                        name="host"
                                        type="text"
                                        value={data.host}
                                        placeholder="e.g., smtp-relay.brevo.com or smtp.mailgun.org"
                                        onChange={handleChange}
                                        className={inputClasses}
                                        required
                                    />
                                    {errors.host && <p className="text-xs text-red-500 mt-1.5">{errors.host}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="port" className={labelClasses}>SMTP Port</label>
                                        <input
                                            id="port"
                                            name="port"
                                            type="number"
                                            value={data.port}
                                            placeholder="e.g., 587"
                                            onChange={handleChange}
                                            className={inputClasses}
                                            required
                                        />
                                        {errors.port && <p className="text-xs text-red-500 mt-1.5">{errors.port}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="encryption" className={labelClasses}>Encryption</label>
                                        <select 
                                            id="encryption" 
                                            name="encryption" 
                                            value={data.encryption} 
                                            onChange={handleChange} 
                                            className={inputClasses}
                                        >
                                            <option value="tls">TLS</option>
                                            <option value="ssl">SSL</option>
                                            <option value="none">None</option>
                                        </select>
                                        {errors.encryption && <p className="text-xs text-red-500 mt-1.5">{errors.encryption}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="username" className={labelClasses}>SMTP Username</label>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        value={data.username}
                                        placeholder="Your SMTP"
                                        onChange={handleChange}
                                        className={inputClasses}
                                        required
                                    />
                                    {errors.username && <p className="text-xs text-red-500 mt-1.5">{errors.username}</p>}
                                </div>

                                <div>
                                    <label htmlFor="password" className={labelClasses}>SMTP Password / API Key</label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            value={data.password}
                                            placeholder={config.host ? "Enter new key to update, or leave blank" : "Your SMTP Password or API Key"}
                                            onChange={handleChange}
                                            className={`${inputClasses} pr-10`}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 px-3 flex items-center text-sm leading-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {config.host && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave blank if you do not want to change the existing password/key.</p>}
                                    {errors.password && <p className="text-xs text-red-500 mt-1.5">{errors.password}</p>}
                                </div>

                                <div>
                                    <label htmlFor="from_address" className={labelClasses}>Default From Address</label>
                                    <input
                                        id="from_address"
                                        name="from_address"
                                        type="email"
                                        value={data.from_address}
                                        placeholder="e.g., no-reply@yourdomain.com"
                                        onChange={handleChange}
                                        className={inputClasses}
                                        required
                                    />
                                    {errors.from_address && <p className="text-xs text-red-500 mt-1.5">{errors.from_address}</p>}
                                </div>

                                <div>
                                    <label htmlFor="from_name" className={labelClasses}>Default From Name</label>
                                    <input
                                        id="from_name"
                                        name="from_name"
                                        type="text"
                                        value={data.from_name}
                                        placeholder="e.g., Your Company Name"
                                        onChange={handleChange}
                                        className={inputClasses}
                                        required
                                    />
                                    {errors.from_name && <p className="text-xs text-red-500 mt-1.5">{errors.from_name}</p>}
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-3">
                                 <Link 
                                    href={route('dashboard')} 
                                    className={secondaryButtonClasses}
                                >
                                    <XCircle size={18} className="mr-2" /> Cancel
                                </Link>
                                <button type="submit" disabled={processing} className={primaryButtonClasses}>
                                    <Save className="mr-2 h-4 w-4" /> {processing ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="mt-8 p-5 bg-blue-50 dark:bg-gray-800/70 border border-blue-200 dark:border-gray-700 rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center">
                            <Settings size={20} className="mr-2.5" />
                            Configuration Guide (Example: Brevo SMTP)
                        </h3>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-1.5">
                            1. Log in to your <a href="https://www.brevo.com" target="_blank" rel="noopener noreferrer" className="font-medium underline hover:text-blue-500">Brevo account</a>.
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-1.5">
                            2. Navigate to the "SMTP & API" section (usually under your account name/profile).
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-1.5">
                            3. Under the "SMTP" tab, you'll find:
                        </p>
                        <ul className="list-disc list-inside text-sm text-blue-600 dark:text-blue-400 pl-5 space-y-1 mb-1.5">
                            <li><strong>SMTP Server:</strong> `smtp-relay.brevo.com` (use for "SMTP Host")</li>
                            <li><strong>Port:</strong> `587` (recommended for TLS encryption)</li>
                            <li><strong>Login:</strong> Your Brevo account email address (use for "SMTP Username")</li>
                            <li><strong>SMTP Key:</strong> Generate a new SMTP key. Copy this and use it for "SMTP Password / API Key".</li>
                        </ul>
                         <p className="text-sm text-blue-600 dark:text-blue-400 mb-1.5">
                            4. For API drivers (Mailgun, Brevo API), you'll typically find an API key in the API section of their respective dashboards.
                        </p>
                        <p className="text-sm text-red-500 dark:text-red-400 mt-3 font-medium">
                            <strong>Important:</strong> Store your API Keys/SMTP Keys securely. LeadSetu will encrypt them, but you should also keep them safe.
                        </p>
                    </div>

                    <div className="mt-8">
                        <form onSubmit={handleTestSmtp} className="flex flex-col md:flex-row items-center gap-3">
                            <input
                                type="email"
                                className={inputClasses + ' max-w-xs'}
                                placeholder="Enter email to send test"
                                value={testEmail}
                                onChange={e => setTestEmail(e.target.value)}
                                required
                            />
                            <button type="submit" className={primaryButtonClasses} disabled={testLoading || !testEmail}>
                                {testLoading ? 'Sending...' : 'Send Test Email'}
                            </button>
                        </form>
                        {testStatus && (
                            <div className={`mt-3 p-3 rounded-lg text-sm flex items-center shadow border ${testStatus.type === 'success' ? 'bg-green-100 border-green-300 text-green-700' : 'bg-red-100 border-red-300 text-red-700'}`}
                                 role="alert">
                                {testStatus.type === 'success' ? <CheckCircle2 size={18} className="mr-2" /> : <XCircle size={18} className="mr-2" />}
                                <span>{testStatus.message}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
