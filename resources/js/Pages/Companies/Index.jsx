import React from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import CompanyLayout from './_CompanyLayout';

export default function CompaniesIndex({ companies = [] }) {
    const { props } = usePage();
    const user = props.auth?.user;
    return (
        <CompanyLayout user={user} title="Companies">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Companies</h1>
                <Link href={route('companies.create')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Company</Link>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Website</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {companies.map(company => (
                            <tr key={company.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{company.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{company.website}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <Link href={route('companies.edit', company.id)} className="text-blue-600 hover:underline mr-2">Edit</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </CompanyLayout>
    );
}
