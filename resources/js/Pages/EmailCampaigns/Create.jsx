import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'; // Assuming this path is correct
import { CheckCircle2, AlertTriangle, Info, CalendarDays, Send, FileText, Users, Palette } from 'lucide-react'; // Added more icons

// Helper component for form field errors
const InputError = ({ message, className = '' }) => {
    return message ? <p className={`text-sm text-red-600 dark:text-red-500 mt-1.5 ${className}`}>{message}</p> : null;
};

export default function EmailCampaignsCreate({ prospectLists, user }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        subject: '',
        body: '',
        prospect_list_ids: [],
        scheduled_at: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('email-campaigns.store'), {
            onSuccess: () => reset(), // Reset form on success
        });
    };

    // Consistent input styling
    const commonInputStyles = "block w-full px-4 py-3 rounded-lg border text-sm shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75";
    const normalBorder = "border-gray-300 dark:border-gray-600";
    const errorBorder = "border-red-500 dark:border-red-400";
    const focusRing = "focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400";
    const placeholderStyles = "placeholder-gray-400 dark:placeholder-gray-500";
    const textStyles = "text-gray-900 dark:text-gray-100";
    const bgStyles = "bg-white dark:bg-gray-700/60";

    const getInputClassName = (fieldHasError) => `${commonInputStyles} ${bgStyles} ${textStyles} ${placeholderStyles} ${fieldHasError ? errorBorder : normalBorder} ${focusRing}`;


    return (
        <AuthenticatedLayout
            user={user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight flex items-center">
                    <Palette size={24} className="mr-3 text-indigo-500" /> Create New Email Campaign
                </h2>
            }
        >
            <Head title="Create Email Campaign" />

            <div className="py-12 font-sans">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8"> {/* Slightly wider for campaign content */}
                    <div className="bg-white dark:bg-gray-800 shadow-2xl overflow-hidden rounded-2xl">
                        <div className="px-6 py-8 sm:px-10">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-10 text-center">
                                Design Your Email Blast
                            </h1>
                            <form onSubmit={handleSubmit} className="space-y-8">

                                {/* Campaign Name */}
                                <div className="space-y-2">
                                    <label htmlFor="name" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <FileText size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
                                        Campaign Name <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        className={getInputClassName(!!errors.name)}
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        required
                                        placeholder="e.g., Summer Sale Announcement"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                {/* Subject */}
                                <div className="space-y-2">
                                    <label htmlFor="subject" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <Send size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
                                        Email Subject <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <input
                                        id="subject"
                                        type="text"
                                        className={getInputClassName(!!errors.subject)}
                                        value={data.subject}
                                        onChange={e => setData('subject', e.target.value)}
                                        required
                                        placeholder="Your compelling subject line"
                                    />
                                    <InputError message={errors.subject} />
                                </div>

                                {/* Email Body */}
                                <div className="space-y-2">
                                    <label htmlFor="body" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <FileText size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
                                        Email Body <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <textarea
                                        id="body"
                                        className={`${getInputClassName(!!errors.body)} min-h-[200px]`}
                                        value={data.body}
                                        onChange={e => setData('body', e.target.value)}
                                        required
                                        placeholder="Craft your engaging email content here..."
                                        rows="8"
                                    />
                                    <InputError message={errors.body} />
                                </div>

                                {/* Prospect Lists */}
                                <div className="space-y-2">
                                    <label htmlFor="prospect_list_ids" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <Users size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
                                        Target Audience (Prospect Lists) <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    {prospectLists && prospectLists.length > 0 ? (
                                        <select
                                            id="prospect_list_ids"
                                            className={`${getInputClassName(!!errors.prospect_list_ids)} py-3`}
                                            multiple
                                            value={data.prospect_list_ids}
                                            onChange={e => {
                                                const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
                                                setData('prospect_list_ids', selectedOptions);
                                            }}
                                            required
                                            size={Math.min(5, Math.max(3, prospectLists.length))} // Show at least 3 options
                                        >
                                            {prospectLists.map(list => (
                                                <option key={list.id} value={list.id} className="p-2 dark:bg-gray-600 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-700">
                                                    {list.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="mt-2 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-700/30 border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-200 flex items-start">
                                            <Info size={20} className="mr-3 flex-shrink-0 text-yellow-500 dark:text-yellow-400" />
                                            <div>
                                                <h4 className="font-semibold">No Prospect Lists Available</h4>
                                                <p className="text-xs">
                                                    Please <Link href={route('prospect-lists.create')} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">create a prospect list</Link> first to select an audience.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <InputError message={errors.prospect_list_ids} />
                                </div>

                                {/* Schedule */}
                                <div className="space-y-2">
                                    <label htmlFor="scheduled_at" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <CalendarDays size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
                                        Schedule Send <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(Optional)</span>
                                    </label>
                                    <input
                                        id="scheduled_at"
                                        type="datetime-local"
                                        className={`${getInputClassName(!!errors.scheduled_at)} dark:[color-scheme:dark]`}
                                        value={data.scheduled_at}
                                        onChange={e => setData('scheduled_at', e.target.value)}
                                    />
                                    <InputError message={errors.scheduled_at} />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-end gap-4 pt-6 border-t dark:border-gray-700/50 mt-10">
                                    <Link
                                        href={route('email-campaigns.index')}
                                        className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all duration-150 ease-in-out"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 ease-in-out"
                                        disabled={processing || (prospectLists && prospectLists.length === 0 && data.prospect_list_ids.length === 0)}
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2.5 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} className="mr-2" /> Create Campaign
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
