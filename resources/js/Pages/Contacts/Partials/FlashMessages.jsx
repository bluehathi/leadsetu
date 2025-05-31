import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function FlashMessages({ flash }) {
    if (!flash.success && !flash.error) return null;
    return (
        <>
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
        </>
    );
}
