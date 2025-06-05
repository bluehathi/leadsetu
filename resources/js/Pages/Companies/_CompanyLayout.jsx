import React from 'react';
import { Head } from '@inertiajs/react';

export default function CompanyLayout({ children, title = 'Companies', user }) {
    return (
        <>
            <Head title={title} />
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
                <div className="flex flex-col w-0 flex-1 overflow-auto">
                    <main className="flex-1 relative">
                        <div className="py-8 px-4 sm:px-6 lg:px-8 mx-auto w-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
