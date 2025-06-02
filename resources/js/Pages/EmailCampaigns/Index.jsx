import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function EmailCampaignsIndex({ campaigns, user }) {
    return (
        <AuthenticatedLayout user={user} title="Email Campaigns">
            <Head title="Email Campaigns" />
            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Email Campaigns</h1>
                    <Link href={route('email-campaigns.create')} className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">New Campaign</Link>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                    {campaigns.data.length === 0 ? (
                        <div className="text-gray-500 dark:text-gray-400">No campaigns found.</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left">Name</th>
                                    <th className="px-4 py-2 text-left">Subject</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className="px-4 py-2 text-left">Prospect List(s)</th>
                                    <th className="px-4 py-2 text-left">Created</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.data.map(campaign => (
                                    <tr key={campaign.id}>
                                        <td className="px-4 py-2 font-medium">{campaign.name}</td>
                                        <td className="px-4 py-2">{campaign.subject}</td>
                                        <td className="px-4 py-2 capitalize">{campaign.status}</td>
                                        <td className="px-4 py-2">
                                            {Array.isArray(campaign.prospect_lists) && campaign.prospect_lists.length > 0
                                                ? campaign.prospect_lists.map(pl => pl.name).join(', ')
                                                : '-'}
                                        </td>
                                        <td className="px-4 py-2">{new Date(campaign.created_at).toLocaleString()}</td>
                                        <td className="px-4 py-2 text-right">
                                            <Link href={route('email-campaigns.show', campaign.id)} className="text-blue-600 hover:underline">View</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
