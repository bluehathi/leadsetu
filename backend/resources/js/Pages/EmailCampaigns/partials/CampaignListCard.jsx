import React from 'react';
import { Link } from '@inertiajs/react';

export default function CampaignListCard({ campaign }) {
    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">{campaign.name}</h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{campaign.subject}</div>
                </div>
                <Link href={route('email-campaigns.show', campaign.id)} className="text-blue-600 hover:underline">View</Link>
            </div>
            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>Status: <span className="capitalize font-medium">{campaign.status}</span></span>
                <span>List: {campaign.prospect_list?.name || '-'}</span>
                <span>Created: {new Date(campaign.created_at).toLocaleString()}</span>
            </div>
        </div>
    );
}
