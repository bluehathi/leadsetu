import React from 'react';
import { Link } from "@inertiajs/react";

const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    iconContainerColor = "bg-blue-100 dark:bg-blue-900/50", // e.g., bg-blue-100 dark:bg-blue-900/50
    iconColor = "text-blue-500 dark:text-blue-400", // e.g., text-blue-500 dark:text-blue-400
    subValue, 
    subLabel, 
    link 
}) => {

    return (
        <Link 
            href={link || '#'} 
            className="block p-5 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group"
        >
            <div className="flex items-center space-x-4">
                {Icon && (
                    <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full shadow-sm ${iconContainerColor}`}>
                        <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors truncate">
                        {title}
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate" title={String(value)}>
                        {value}
                    </p>
                </div>
            </div>
            {subValue && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                    {subLabel && <span className="font-medium">{subLabel}: </span>}{subValue}
                </p>
            )}
        </Link>
    );
};

export default StatCard;
