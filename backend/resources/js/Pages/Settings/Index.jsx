import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Settings, User, Server, Briefcase } from 'lucide-react';

export default function SettingsIndex() {
    const { props } = usePage();
    const user = props?.user;
    const settings = [
        {
            name: 'Workspace Settings',
            description: 'Manage your workspace name, logo, and other workspace-wide options.',
            icon: <Briefcase size={22} className="text-blue-500 mr-3" />,
            href: route('workspace.settings'),
        },
        {
            name: 'Profile Settings',
            description: 'Update your personal profile information and password.',
            icon: <User size={22} className="text-green-500 mr-3" />,
            href: route('profile'),
        },
        {
            name: 'SMTP Settings',
            description: 'Configure outgoing email (SMTP) for your workspace.',
            icon: <Server size={22} className="text-indigo-500 mr-3" />,
            href: route('smtp.index'),
        },
    ];

    return (
        <AuthenticatedLayout user={user} title="Settings">
            <Head title="Settings" />
            <div className="py-8 px-4 sm:px-6 lg:px-8 w-full mx-auto">
                <h1 className="text-3xl font-bold mb-8 flex items-center">
                    <Settings size={32} className="mr-3 text-blue-600" />
                    Settings
                </h1>
                <div className="space-y-5">
                    {settings.map((setting, idx) => (
                        <Link
                            key={setting.name}
                            href={setting.href}
                            className="flex items-center p-5 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all group"
                        >
                            {setting.icon}
                            <div className="flex-1 min-w-0">
                                <div className="text-lg font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{setting.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{setting.description}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
