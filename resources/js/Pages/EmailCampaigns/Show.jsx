import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function EmailCampaignShow({ campaign, user, stats }) {
    const [sending, setSending] = useState(false);
    const [scheduling, setScheduling] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [error, setError] = useState(null);
    const [modalType, setModalType] = useState(null); // 'total', 'sent', 'failed', 'opened', 'clicked'
    const [modalContacts, setModalContacts] = useState([]);
    const canSend = campaign.status === 'draft' || campaign.status === 'scheduled';

    const handleSendNow = () => {
        setSending(true);
        setError(null);
        router.post(route('email-campaigns.send', campaign.id), {}, {
            onFinish: () => setSending(false),
            onError: (e) => setError(e),
        });
    };
    const handleSchedule = (e) => {
        e.preventDefault();
        setScheduling(true);
        setError(null);
        router.post(route('email-campaigns.schedule', campaign.id), { scheduled_at: scheduleDate }, {
            onFinish: () => setScheduling(false),
            onError: (e) => setError(e),
        });
    };

    // Fetch contacts for a specific stat type
    const fetchContacts = (type) => {
        setModalType(type);
        setModalContacts([]);
        router.get(route('email-campaigns.show', [campaign.id]), { filter: type }, {
            preserveScroll: true,
            preserveState: true, // <-- add this to keep modal open and state
            only: ['contacts'], // only update contacts prop
            onSuccess: (page) => {
                setModalContacts(page.props.contacts || []);
            },
        });
    };

    const closeModal = () => {
        setModalType(null);
        setModalContacts([]);
    };

    return (
        <AuthenticatedLayout user={user} title={campaign.name}>
            <Head title={campaign.name} />
            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{campaign.name}</h1>
                    <Link href={route('email-campaigns.index')} className="text-blue-600 hover:underline">Back to Campaigns</Link>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    {/* --- Campaign Statistics --- */}
                    {stats && (
                        <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                            <button className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 w-full" onClick={() => fetchContacts('total')}>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Total Contacts</div>
                                <div className="text-xl font-bold text-gray-800 dark:text-white">{stats.total_contacts}</div>
                            </button>
                            <button className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 w-full" onClick={() => fetchContacts('sent')}>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Sent</div>
                                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.sent}</div>
                            </button>
                            <button className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 w-full" onClick={() => fetchContacts('failed')}>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Failed</div>
                                <div className="text-xl font-bold text-red-600 dark:text-red-400">{stats.failed}</div>
                            </button>
                            <button className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 w-full" onClick={() => fetchContacts('opened')}>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Opened</div>
                                <div className="text-xl font-bold text-green-600 dark:text-green-400">{stats.opened}</div>
                            </button>
                            <button className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 w-full" onClick={() => fetchContacts('clicked')}>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Clicked</div>
                                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.clicked}</div>
                            </button>
                        </div>
                    )}
                    {/* Modal for contacts */}
                    {modalType && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full p-6 relative animate-fade-in">
                                <button
                                    onClick={closeModal}
                                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none transition-colors"
                                    aria-label="Close"
                                    title="Close"
                                >
                                    &times;
                                </button>
                                <h2 className="text-xl font-bold mb-4 capitalize flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                                    {modalType} Contacts
                                </h2>
                                {modalContacts.length === 0 ? (
                                    <div className="text-gray-500 text-center py-8">No contacts found.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                            <thead>
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Name</th>
                                                    <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Email</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto">
                                                {modalContacts.map((c) => (
                                                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{c.name}</td>
                                                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{c.email}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="mb-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Subject:</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{campaign.subject}</div>
                    </div>
                    <div className="mb-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Status:</div>
                        <div className="text-base font-medium text-gray-800 dark:text-gray-200 capitalize">{campaign.status}</div>
                    </div>
                    <div className="mb-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Prospect List(s):</div>
                        <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                            {Array.isArray(campaign.prospect_lists) && campaign.prospect_lists.length > 0
                                ? campaign.prospect_lists.map(pl => pl.name).join(', ')
                                : '-'}
                        </div>
                    </div>
                    <div className="mb-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Email Body:</div>
                        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: campaign.body }} />
                    </div>
                    <div className="mb-6 flex gap-4">
                        <button
                            className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                            onClick={handleSendNow}
                            disabled={!canSend || sending}
                        >
                            {sending ? 'Sending...' : 'Send Now'}
                        </button>
                        <form onSubmit={handleSchedule} className="flex items-center gap-2">
                            <input
                                type="datetime-local"
                                value={scheduleDate}
                                onChange={e => setScheduleDate(e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                                required
                                min={new Date().toISOString().slice(0, 16)}
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
                                disabled={!canSend || scheduling}
                            >
                                {scheduling ? 'Scheduling...' : 'Schedule'}
                            </button>
                        </form>
                    </div>
                    {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
                    {/* ...existing code... */}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
