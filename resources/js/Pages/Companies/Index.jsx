import React, { useState, useEffect } from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import CompanyLayout from './_CompanyLayout'; // Assuming this path is correct
import AutheticatedLayout from '@/Layouts/AuthenticatedLayout'; // Assuming this path is correct
import { PlusCircle, Edit3, Search, Briefcase, Filter as FilterIcon, Link as LinkIcon } from 'lucide-react'; // Added LinkIcon

// Helper function to generate a placeholder logo style (remains the same)
const getLogoPlaceholder = (name) => {
    const colors = [
        'bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 
        'bg-purple-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
    ];
    if (!name) name = "C"; 
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];
    return {
        colorClass: color,
        initial: name.charAt(0).toUpperCase()
    };
};

export default function CompaniesIndex({ companies: initialCompanies = [] }) { // Renamed prop for clarity
    const { props } = usePage();
    const user = props.auth?.user;
    const [isListMounted, setIsListMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setIsListMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // Filter companies based on search term
    const filteredCompanies = initialCompanies.filter(company => {
        const term = searchTerm.toLowerCase();
        return (
            company.name.toLowerCase().includes(term) ||
            (company.website && company.website.toLowerCase().includes(term))
        );
    });

    return (
        <>
            <Head title="Companies" />
            {/* The "Companies" title is passed to AuthenticatedLayout, so it will appear in the layout's header */}
            <AutheticatedLayout user={user} title="Companies">
                <CompanyLayout user={user} title="Companies"> {/* This title prop might be redundant if AuthenticatedLayout already shows it */}
                    {/* Top Bar: Search Filter and Add Company Button */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 px-1 gap-4">
                        {/* Search Input - now on the left */}
                        <div className="relative w-full "> {/* Adjusted max-width for responsiveness */}
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                            </div>
                            <input
                                type="text"
                                name="search-companies"
                                id="search-companies"
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md"
                                placeholder="Search companies..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Add Company Button - now on the right */}
                        <Link 
                            href={route('companies.create')} 
                            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm font-medium w-full sm:w-auto justify-center" // Added w-full sm:w-auto and justify-center
                        >
                            <PlusCircle size={18} className="-ml-1 mr-2" />
                            Add
                        </Link>
                    </div>

                    {/* Companies List Area */}
                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-3 sm:p-4">
                        {filteredCompanies.length > 0 ? (
                            <div className="space-y-3">
                                {filteredCompanies.map((company, index) => {
                                    const logo = getLogoPlaceholder(company.name);
                                    const websiteUrl = company.website && (company.website.startsWith('http://') || company.website.startsWith('https://')) 
                                                       ? company.website 
                                                       : `http://${company.website}`;

                                    return (
                                        <div 
                                            key={company.id} 
                                            // Using Grid layout for the card
                                            className={`grid grid-cols-2 sm:grid-cols-[1fr_auto] items-center gap-y-3 sm:gap-x-4 p-4 bg-white dark:bg-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-300 ease-in-out shadow-md hover:shadow-lg border border-transparent hover:border-blue-300 dark:hover:border-blue-700
                                                        ${isListMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
                                            style={{ animationDelay: isListMounted ? `${index * 0.08}s` : '0s' }}
                                        >
                                            {/* Left Part (Grid Column 1): Logo and Name/Website Icon */}
                                            {/* This part now uses flex internally for its own content alignment */}
                                            <div className="flex items-center min-w-0 w-full"> {/* w-full to take available space in its grid cell */}
                                                <div className={`w-11 h-11 ${logo.colorClass} rounded-lg flex items-center justify-center text-white font-semibold text-lg mr-4 flex-shrink-0 shadow-sm`}>
                                                    {logo.initial}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-base truncate" title={company.name}>
                                                        {company.name}
                                                    </h3>
                                                    {company.website ? (
                                                        <a 
                                                            href={websiteUrl}
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 inline-flex items-center group mt-0.5"
                                                            title={`Visit ${company.name}'s website`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <LinkIcon size={14} className="mr-1 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                                                            <span className="text-xs group-hover:underline">Website</span>
                                                        </a>
                                                    ) : (
                                                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">No website</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Part (Grid Column 2 on sm+ screens, or stacks below on xs): Actions (Edit Link) */}
                                            <div className="flex-shrink-0 w-full sm:w-auto flex justify-end  sm:col-start-2"> {/* sm:col-start-2 to ensure it's in the second column on larger screens */}
                                                <Link 
                                                    href={route('companies.edit', company.id)} 
                                                    className="inline-flex items-center text-xs font-medium px-3.5 py-1.5 rounded-md text-blue-600 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/30 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Edit3 size={14} className="mr-1.5" />
                                                    Edit
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16 px-6 bg-gray-50 dark:bg-gray-800/40 rounded-lg">
                                <Search size={52} className="mx-auto mb-5 text-blue-400 dark:text-blue-500" />
                                <h3 className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-100">
                                    {searchTerm ? 'No Companies Found' : 'No Companies Yet'}
                                </h3>
                                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                                    {searchTerm ? 'Try adjusting your search term.' : 'Get started by adding your first company to the CRM.'}
                                </p>
                                {!searchTerm && ( // Only show "Add First Company" if not searching
                                    <div className="mt-8">
                                        <Link 
                                            href={route('companies.create')} 
                                            className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm font-medium"
                                        >
                                            <PlusCircle size={18} className="-ml-1 mr-2" />
                                            Add First Company
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CompanyLayout>
            </AutheticatedLayout>
        </>
    );
}
