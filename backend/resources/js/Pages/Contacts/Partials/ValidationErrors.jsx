import React from 'react';

export default function ValidationErrors({ errors }) {
    if (!errors || Object.keys(errors).length === 0) return null;
    return (
        <div className="mb-5 p-4 bg-red-100 dark:bg-red-700/30 border border-red-300 dark:border-red-600 rounded-lg text-sm text-red-700 dark:text-red-200 shadow" role="alert">
            <ul className="list-disc pl-5">
                {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>{message}</li>
                ))}
            </ul>
        </div>
    );
}
