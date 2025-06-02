import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function CampaignLayout({ user, title, children }) {
    return (
        <AuthenticatedLayout user={user} title={title}>
            <div className="max-w-5xl mx-auto w-full">
                {children}
            </div>
        </AuthenticatedLayout>
    );
}
