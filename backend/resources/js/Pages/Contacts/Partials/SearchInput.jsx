import React from 'react';
import { Search } from 'lucide-react';

export default function SearchInput({ searchText, setSearchText, applySearch }) {
    return (
        <div className="relative w-full sm:w-auto sm:max-w-xs md:max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700/50 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 transition-shadow shadow-sm focus:shadow-md"
                placeholder="Search contacts..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        applySearch();
                    }
                }}
            />
        </div>
    );
}
