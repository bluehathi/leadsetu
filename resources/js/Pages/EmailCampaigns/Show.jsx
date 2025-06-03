import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react'; // Added usePage
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    ArrowLeft, Mail, Send, CalendarClock, Users, BarChart3, Eye, X, ListChecks, AlertCircle,
    CheckCircle2, Info, ExternalLink, Edit3, Clock, MessageCircle, MousePointerClick, AlertOctagon, UserCheck, UserX
} from 'lucide-react';

// Helper to format status - reusing from Index page for consistency
const CampaignStatusBadge = ({ status, className = '' }) => {
    let bgColor = 'bg-gray-100 dark:bg-gray-700';
    let textColor = 'text-gray-700 dark:text-gray-300';
    let dotColor = 'bg-gray-400';

    switch (status?.toLowerCase()) {
        case 'draft':
            bgColor = 'bg-yellow-100 dark:bg-yellow-800/40';
            textColor = 'text-yellow-800 dark:text-yellow-200';
            dotColor = 'bg-yellow-500 dark:bg-yellow-400';
            break;
        case 'scheduled':
            bgColor = 'bg-blue-100 dark:bg-blue-800/40';
            textColor = 'text-blue-800 dark:text-blue-200';
            dotColor = 'bg-blue-500 dark:bg-blue-400';
            break;
        case 'sending':
            bgColor = 'bg-teal-100 dark:bg-teal-800/40';
            textColor = 'text-teal-800 dark:text-teal-200';
            dotColor = 'bg-teal-500 dark:bg-teal-400';
            break;
        case 'sent':
            bgColor = 'bg-green-100 dark:bg-green-800/40';
            textColor = 'text-green-800 dark:text-green-200';
            dotColor = 'bg-green-500 dark:bg-green-400';
            break;
        case 'failed':
            bgColor = 'bg-red-100 dark:bg-red-800/40';
            textColor = 'text-red-800 dark:text-red-200';
            dotColor = 'bg-red-500 dark:bg-red-400';
            break;
        default:
            bgColor = 'bg-gray-100 dark:bg-gray-800/40';
            textColor = 'text-gray-800 dark:text-gray-200';
            dotColor = 'bg-gray-500 dark:bg-gray-400';
            break;
    }

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${bgColor} ${textColor} shadow-sm ${className}`}>
            <span className={`w-2 h-2 mr-2 rounded-full ${dotColor}`}></span>
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
        </span>
    );
};

const StatCard = ({ title, value, icon: Icon, colorClass = "text-gray-800 dark:text-white", bgColorClass = "bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700", onClick }) => (
    <button
        onClick={onClick}
        className={`p-4 rounded-xl shadow-lg w-full text-center transition-all duration-150 ease-in-out transform hover:scale-105 ${bgColorClass}`}
    >
        <div className="flex items-center justify-center mb-2">
            <Icon size={20} className={`mr-2 ${colorClass || 'text-gray-500 dark:text-gray-400'}`} />
            <div className={`text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{title}</div>
        </div>
        <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
    </button>
);


export default function EmailCampaignShow({ campaign, user, stats, contacts: initialContacts }) { // Added initialContacts for modal
    const { props } = usePage();
    const flash = props.flash || {}; // For potential flash messages from actions
    const [sending, setSending] = useState(false);
    const [scheduling, setScheduling] = useState(false);
    const [scheduleDate, setScheduleDate] = useState(campaign.scheduled_at ? new Date(campaign.scheduled_at).toISOString().slice(0, 16) : '');
    const [actionError, setActionError] = useState(null); // Renamed from error to avoid conflict
    const [modalType, setModalType] = useState(null);
    const [modalContacts, setModalContacts] = useState([]);
    const [isModalLoading, setIsModalLoading] = useState(false);

    const canSend = campaign.status === 'draft' || campaign.status === 'scheduled';
    const isSentOrSending = campaign.status === 'sent' || campaign.status === 'sending';


    useEffect(() => {
        // Use contacts from props (from usePage) if present, otherwise fallback to initialContacts
        const contacts = props.contacts || initialContacts;
        if (contacts && modalType) {
            setModalContacts(contacts || []);
            setIsModalLoading(false);
        }
    }, [props.contacts, modalType]);

    const handleSendNow = () => {
        if (!confirm('Are you sure you want to send this campaign now?')) return;
        setSending(true);
        setActionError(null);
        router.post(route('email-campaigns.send', campaign.id), {}, {
            onFinish: () => setSending(false),
            onError: (errors) => {
                setActionError(errors.message || 'Failed to send campaign.');
                setSending(false);
            },
            preserveScroll: true,
        });
    };

    const handleSchedule = (e) => {
        e.preventDefault();
        if (!scheduleDate) {
            setActionError('Please select a date and time to schedule.');
            return;
        }
        if (!confirm(`Are you sure you want to schedule this campaign for ${new Date(scheduleDate).toLocaleString()}?`)) return;
        setScheduling(true);
        setActionError(null);
        router.post(route('email-campaigns.schedule', campaign.id), { scheduled_at: scheduleDate }, {
            onFinish: () => setScheduling(false),
            onError: (errors) => {
                setActionError(errors.message || 'Failed to schedule campaign.');
                setScheduling(false);
            },
            preserveScroll: true,
        });
    };

    const fetchContacts = (type) => {
        setModalType(type);
        setModalContacts([]); // Clear previous contacts
        setIsModalLoading(true); // Set loading state for modal
        router.get(route('email-campaigns.show', campaign.id), { filter: type }, {
            preserveScroll: true,
            preserveState: true,
            only: ['contacts', 'flash'], // Ensure 'contacts' is in 'only'
            onSuccess: (page) => {
                console.log(page.props)
                // This will be handled by the useEffect hook for initialContacts
            },
            onError: () => {
                setIsModalLoading(false);
                // Handle error fetching contacts for modal if needed
            }
        });
    };

    const closeModal = () => {
        setModalType(null);
        setModalContacts([]);
        // Clear the 'filter' query parameter by reloading without it if it was set
        if (new URLSearchParams(window.location.search).has('filter')) {
            router.get(route('email-campaigns.show', campaign.id), {}, {
                preserveScroll: true,
                preserveState: true, // Keep other component state
                only: ['flash'], // just to refresh props if needed, but mainly to clear filter
            });
        }
    };

    const getModalTitleAndIcon = () => {
        switch (modalType) {
            case 'total': return { title: 'Total Recipients', Icon: Users, color: 'text-gray-500 dark:text-gray-400' };
            case 'sent': return { title: 'Sent To', Icon: UserCheck, color: 'text-blue-500 dark:text-blue-400' };
            case 'failed': return { title: 'Failed Deliveries', Icon: UserX, color: 'text-red-500 dark:text-red-400' };
            case 'opened': return { title: 'Opened By', Icon: Eye, color: 'text-green-500 dark:text-green-400' };
            case 'clicked': return { title: 'Clicked By', Icon: MousePointerClick, color: 'text-purple-500 dark:text-purple-400' };
            default: return { title: 'Contacts', Icon: Users, color: 'text-gray-500 dark:text-gray-400' };
        }
    };
    const modalInfo = getModalTitleAndIcon();


    return (
        <AuthenticatedLayout
            user={user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight flex items-center">
                    <Mail size={24} className="mr-3 text-indigo-500" /> Campaign Details: {campaign.name}
                </h2>
            }
        >
            <Head title={campaign.name} />

            <div className="py-12 font-sans">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8"> {/* Wider layout */}

                    {/* Global Flash Messages */}
                    {flash.success && (
                        <div className="mb-6 p-4 bg-green-100 dark:bg-green-700/40 border border-green-500 dark:border-green-600 rounded-lg text-sm text-green-800 dark:text-green-100 flex items-start shadow-lg" role="alert">
                            <CheckCircle2 className="h-5 w-5 mr-3 text-green-600 dark:text-green-300 flex-shrink-0 mt-0.5" />
                            <span>{flash.success}</span>
                        </div>
                    )}
                    {flash.error && (
                        <div className="mb-6 p-4 bg-red-100 dark:bg-red-700/40 border border-red-500 dark:border-red-600 rounded-lg text-sm text-red-800 dark:text-red-100 flex items-start shadow-lg" role="alert">
                            <AlertCircle className="h-5 w-5 mr-3 text-red-600 dark:text-red-300 flex-shrink-0 mt-0.5" />
                            <span>{flash.error}</span>
                        </div>
                    )}
                    {actionError && (
                        <div className="mb-6 p-4 bg-red-100 dark:bg-red-700/40 border border-red-500 dark:border-red-600 rounded-lg text-sm text-red-800 dark:text-red-100 flex items-start shadow-lg" role="alert">
                            <AlertOctagon className="h-5 w-5 mr-3 text-red-600 dark:text-red-300 flex-shrink-0 mt-0.5" />
                            <span>{typeof actionError === 'string' ? actionError : 'An unexpected error occurred.'}</span>
                        </div>
                    )}


                    {/* Header Section */}
                    <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{campaign.name}</h1>
                            <div className="mt-2 flex items-center gap-x-4">
                                <CampaignStatusBadge status={campaign.status} />
                                <Link href={route('email-campaigns.edit', campaign.id)} className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">
                                    <Edit3 size={14} className="mr-1.5" /> Edit Campaign
                                </Link>
                            </div>
                        </div>
                        <Link
                            href={route('email-campaigns.index')}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-all"
                        >
                            <ArrowLeft size={16} className="mr-2" /> Back to Campaigns
                        </Link>
                    </div>


                    {/* Campaign Statistics */}
                    {stats && (
                        <div className="mb-10">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                                <BarChart3 size={20} className="mr-2 text-indigo-500" /> Performance Overview
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                <StatCard title="Total Recipients" value={stats.total_contacts || 0} icon={Users} colorClass="text-gray-700 dark:text-gray-200" onClick={() => fetchContacts('total')} />
                                <StatCard title="Sent" value={stats.sent || 0} icon={UserCheck} colorClass="text-blue-600 dark:text-blue-400" onClick={() => fetchContacts('sent')} />
                                <StatCard title="Opened" value={stats.opened || 0} icon={Eye} colorClass="text-green-600 dark:text-green-400" onClick={() => fetchContacts('opened')} />
                                <StatCard title="Clicked" value={stats.clicked || 0} icon={MousePointerClick} colorClass="text-purple-600 dark:text-purple-400" onClick={() => fetchContacts('clicked')} />
                                <StatCard title="Failed" value={stats.failed || 0} icon={UserX} colorClass="text-red-600 dark:text-red-400" onClick={() => fetchContacts('failed')} />
                            </div>
                        </div>
                    )}

                    {/* Campaign Details & Actions */}
                    <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden">
                        <div className="px-6 py-8 sm:px-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                                <div>
                                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</h3>
                                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{campaign.subject}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target Audience</h3>
                                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                        {Array.isArray(campaign.prospect_lists) && campaign.prospect_lists.length > 0
                                            ? campaign.prospect_lists.map(pl => pl.name).join(', ')
                                            : <span className="italic">Not specified</span>}
                                    </p>
                                </div>
                                {campaign.scheduled_at && campaign.status === 'scheduled' && (
                                    <div>
                                        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scheduled For</h3>
                                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                                            <Clock size={14} className="mr-1.5 text-gray-400 dark:text-gray-500" />
                                            {new Date(campaign.scheduled_at).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {!isSentOrSending && (
                                <div className="mb-8 p-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Campaign Actions</h3>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                                        <button
                                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                            onClick={handleSendNow}
                                            disabled={!canSend || sending || scheduling}
                                        >
                                            {sending ? (
                                                <><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Sending...</>
                                            ) : (
                                                <><Send size={16} className="mr-2" /> Send Now</>
                                            )}
                                        </button>

                                        <form onSubmit={handleSchedule} className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
                                            <div className="flex-grow">
                                                <label htmlFor="scheduleDate" className="sr-only">Schedule Date</label>
                                                <input
                                                    id="scheduleDate"
                                                    type="datetime-local"
                                                    value={scheduleDate}
                                                    onChange={e => setScheduleDate(e.target.value)}
                                                    className="block w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/60 text-gray-800 dark:text-gray-200 text-sm shadow-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition"
                                                    required
                                                    min={new Date().toISOString().slice(0, 16)}
                                                    disabled={!canSend || sending || scheduling}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                                disabled={!canSend || sending || scheduling || !scheduleDate}
                                            >
                                                {scheduling ? (
                                                    <><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Scheduling...</>
                                                ) : (
                                                    <><CalendarClock size={16} className="mr-2" /> Schedule</>
                                                )}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                            {isSentOrSending && (
                                <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-700/30 border-l-4 border-blue-500 dark:border-blue-400 rounded-r-lg">
                                    <div className="flex items-center">
                                        <Info size={20} className="mr-3 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                        <p className="text-sm text-blue-700 dark:text-blue-200">
                                            This campaign is currently {campaign.status}. Further actions like sending or scheduling are disabled.
                                        </p>
                                    </div>
                                </div>
                            )}


                            <div>
                                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email Preview</h3>
                                <div className="p-4 sm:p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 min-h-[200px]">
                                    <div
                                        className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: campaign.body_html || campaign.body }} // Prefer body_html if available
                                    />
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Modal for contacts */}
                    {modalType && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-fast">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-xl w-full max-h-[80vh] flex flex-col">
                                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                                    <h2 className={`text-lg font-semibold flex items-center ${modalInfo.color}`}>
                                        <modalInfo.Icon size={20} className="mr-2.5" />
                                        {modalInfo.title} ({isModalLoading ? '...' : modalContacts.length})
                                    </h2>
                                    <button
                                        onClick={closeModal}
                                        className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 focus:outline-none transition-colors rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        aria-label="Close"
                                    >
                                        <X size={22} />
                                    </button>
                                </div>

                                <div className="p-5 overflow-y-auto">
                                    {isModalLoading ? (
                                        <div className="text-center py-10">
                                            <svg className="animate-spin h-8 w-8 text-indigo-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading contacts...</p>
                                        </div>
                                    ) : modalContacts.length === 0 ? (
                                        <div className="text-center py-10">
                                            <ListChecks size={32} className="mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                                            <p className="text-sm text-gray-500 dark:text-gray-400">No contacts found for this category.</p>
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {modalContacts.map((c) => (
                                                <li key={c.id} className="py-3 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{c.email}</p>
                                                    </div>
                                                    {/* Optional: Action per contact, e.g., link to contact's profile */}
                                                    {/* <Link href={route('contacts.show', c.id)} className="text-xs text-indigo-500 hover:underline">
                                                        <ExternalLink size={14} />
                                                    </Link> */}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-right">
                                    <button
                                        onClick={closeModal}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
