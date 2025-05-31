// resources/js/Pages/Contacts/Show.jsx
import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ChevronLeft, Edit2, Trash2, Send, Mail, Phone, Building, Briefcase, Globe, Info } from 'lucide-react'; 
import ComposeEmailModal from './Partials/ComposeEmailModal';
import FlashMessages from './Partials/FlashMessages';
import { getAvatarPlaceholder } from '@/Utils/Avatar';




export default function ContactShow({ user, contact, smtpConfig, emailLogs = [] }) {
  
    const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
    const avatar = getAvatarPlaceholder(contact.name);

    const { props } = usePage(); 
    const flash = props.flash || {};

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete the contact "${contact.name}"? This action cannot be undone.`)) {
            router.delete(route('contacts.destroy', contact.id), {
                preserveScroll: true,
            });
        }
    };

    const openComposeModal = () => {
        if (!smtpConfig || !smtpConfig.from_address) {
            alert("SMTP settings are not configured for this workspace. Please configure them in settings to send emails.");
            // Optionally, you could use Inertia router to redirect to SMTP settings page
            // router.visit(route('mailConfiguration.edit'));
            return;
        }
        setIsComposeModalOpen(true);
    };

    const closeComposeModal = () => {
        setIsComposeModalOpen(false);
    };

    const DetailItem = ({ icon: Icon, label, value, href, isLink = false, linkTarget = "_self" }) => (
        value ? (
            <div className="py-3 sm:py-4">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                    <Icon size={16} className="mr-2 opacity-70" />
                    {label}
                </dt>
                {isLink && href ? (
                    <dd className="mt-1 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        <a href={href} target={linkTarget} rel={linkTarget === "_blank" ? "noopener noreferrer" : undefined}>{value}</a>
                    </dd>
                ) : (
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value}</dd>
                )}
            </div>
        ) : null
    );

    // Email log rendering helper
    const renderEmailLogs = () => (
        <div className="mt-8 bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white flex items-center">
                    <Mail size={20} className="mr-2.5 text-blue-500" />
                    Email Log History
                </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700 px-6 py-2">
                {emailLogs.length === 0 ? (
                    <div className="py-6 text-center text-gray-400 dark:text-gray-500 text-sm">No emails sent to this contact yet.</div>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {emailLogs.map(log => (
                            <li key={log.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <div className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                        <Mail size={16} className="text-blue-400" />
                                        {log.subject || <span className="italic text-gray-400">(No subject)</span>}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Sent: {log.sent_at ? new Date(log.sent_at).toLocaleString() : 'N/A'}
                                        {log.status && (
                                            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${log.status === 'sent' ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200' : 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200'}`}>{log.status}</span>
                                        )}
                                    </div>
                                    {log.error_message && (
                                        <div className="text-xs text-red-500 mt-1">Error: {log.error_message}</div>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                                    To: {log.recipient_email}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout
            user={user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Link href={route('contacts.index')} className="mr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                            <ChevronLeft size={24} />
                        </Link>
                        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                            Contact Details
                        </h2>
                    </div>
                </div>
            }
            title={`Contact - ${contact.name}`}
        >
            <Head title={`Contact - ${contact.name}`} />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="w-full mx-auto">
                  

                     <FlashMessages flash={flash} />

                    {/* Contact Header Section */}
                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 sm:p-8 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center mb-4 sm:mb-0">
                                <div className={`w-20 h-20 ${avatar.colorClass} rounded-full flex items-center justify-center text-white text-3xl font-semibold mr-6 shadow-md`}>
                                    {avatar.initials}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{contact.name}</h1>
                                    {contact.title && (
                                        <p className="text-lg text-gray-600 dark:text-gray-400 flex items-center mt-1">
                                            <Briefcase size={18} className="mr-2 opacity-70" />
                                            {contact.title}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-shrink-0 space-x-2 mt-4 sm:mt-0">
                                <button
                                    onClick={openComposeModal}
                                    disabled={!smtpConfig || !smtpConfig.from_address}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={16} className="mr-2" /> Email
                                </button>
                                <Link
                                    href={route('contacts.edit', contact.id)}
                                    className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 text-sm font-medium"
                                >
                                    <Edit2 size={16} className="mr-2" /> Edit
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 text-sm font-medium"
                                >
                                    <Trash2 size={16} className="mr-2" /> Delete
                                </button>
                            </div>
                        </div>
                        {!smtpConfig || !smtpConfig.from_address ? (
                            <p className="text-xs text-red-500 mt-3 text-center sm:text-left">
                                Email sending is disabled. Please configure SMTP settings for this workspace. 
                                <Link href={route('mailConfiguration.edit')} className="underline ml-1 hover:text-red-700">Configure now</Link>
                            </p>
                        ):''}
                       
                    </div>

                    {/* Contact Details Card */}
                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white flex items-center">
                                <Info size={20} className="mr-2.5 text-blue-500" />
                                Contact Information
                            </h3>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-2">
                            <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                                <DetailItem icon={Mail} label="Email Address" value={contact.email} href={`mailto:${contact.email}`} isLink />
                                <DetailItem icon={Phone} label="Phone Number" value={contact.phone} href={`tel:${contact.phone}`} isLink />
                                {contact.company && (
                                    <>
                                        <DetailItem icon={Building} label="Company" value={contact.company.name} />
                                        <DetailItem 
                                            icon={Globe} 
                                            label="Company Website" 
                                            value={contact.company.website} 
                                            href={contact.company.website && (contact.company.website.startsWith('http') ? contact.company.website : `https://${contact.company.website}`)} 
                                            isLink 
                                            linkTarget="_blank"
                                        />
                                    </>
                                )}
                                {/* Add more fields like address, notes, etc. as DetailItem here */}
                                {/* Example for a custom field if you have it */}
                                {/* <DetailItem icon={Info} label="Source" value={contact.source} /> */}
                            </dl>
                        </div>
                    </div>

                    {/* Email Log History Section */}
                    {renderEmailLogs()}

                    {/* Future sections like Activity, Notes, Deals can be added here as separate cards */}
                    {/* <div className="mt-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">Activity</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Activity feed coming soon...</p>
                        </div>
                    </div>
                    */}
                </div>
            </div>

            {contact && smtpConfig && ( // Ensure contact and settings are loaded before rendering modal
                <ComposeEmailModal
                    isOpen={isComposeModalOpen}
                    onClose={closeComposeModal}
                    contact={contact}
                    workspaceFromAddress={smtpConfig.from_address}
                    workspaceFromName={smtpConfig.from_name}
                    // processingRequest={/* pass processing state from modal's own useForm if needed */}
                />
            )}
        </AuthenticatedLayout>
    );
}