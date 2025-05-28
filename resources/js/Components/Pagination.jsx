import React from 'react';
import { Link } from "@inertiajs/react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'; // Added MoreHorizontal for ellipsis

/**
 * Renders pagination links provided by Laravel's Paginator.
 * It expects the 'links' array which includes URLs, labels, and active/disabled states.
 *
 * @param {object} props
 * @param {Array} props.links - The links array from the Laravel Paginator object. Each link object typically has 'url', 'label', 'active'.
 * @param {string} [props.className=''] - Optional additional CSS classes for the main nav container.
 * @param {object} [props.meta={}] - Optional meta data from Laravel paginator (for showing "Showing X to Y of Z results").
 * @returns {JSX.Element|null} The pagination component or null if no links need to be rendered.
 */
export default function Pagination({ links = [], meta = {}, className = '' }) {
    // Don't render the component if there are 3 or fewer links (typically just prev, page 1, next)
    // or if there's only one page of results based on meta.
    if (!links || links.length <= 3 || (meta && meta.last_page <= 1) ) {
        return null;
    }

    return (
        <nav
            className={`flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 ${className}`}
            aria-label="Pagination"
        >
            {/* "Showing X to Y of Z results" - visible on sm+ screens */}
            <div className="hidden sm:block mb-2 sm:mb-0">
                {meta.total > 0 && (
                     <p className="text-sm text-gray-700 dark:text-gray-400">
                        Showing <span className="font-semibold text-gray-800 dark:text-gray-200">{meta.from || 0}</span> to <span className="font-semibold text-gray-800 dark:text-gray-200">{meta.to || 0}</span> of{' '}
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{meta.total || 0}</span> results
                    </p>
                )}
            </div>

            <div className="flex flex-1 justify-between sm:justify-end">
                <div className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                    {links.map((link, index) => {
                        const isFirst = index === 0;
                        const isLast = index === links.length - 1;
                        const isDisabled = !link.url;
                        const isActive = link.active;

                        let labelContent;
                        if (isFirst) {
                            labelContent = (
                                <>
                                    <ChevronLeft size={18} className="mr-1 sm:mr-0" aria-hidden="true" />
                                    <span className="hidden sm:inline">Previous</span>
                                </>
                            );
                        } else if (isLast) {
                            labelContent = (
                                <>
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight size={18} className="ml-1 sm:ml-0" aria-hidden="true" />
                                </>
                            );
                        } else if (link.label.includes('...')) {
                             labelContent = <MoreHorizontal size={18} aria-hidden="true" />;
                        }
                        else {
                            labelContent = <span dangerouslySetInnerHTML={{ __html: link.label }} />;
                        }

                        const baseClasses = "relative inline-flex items-center px-3 sm:px-4 py-2 border text-sm font-medium focus:z-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-150 ease-in-out";
                        const activeClasses = "z-10 bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500 dark:text-white shadow-md";
                        const defaultClasses = "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100";
                        const disabledClasses = "bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-70";
                        
                        const firstLinkClasses = "rounded-l-lg";
                        const lastLinkClasses = "rounded-r-lg";
                        // For single page numbers, make them more square-ish
                        const pageNumberClasses = (!isFirst && !isLast && !link.label.includes('...')) ? "min-w-[2.5rem] justify-center" : "";


                        let combinedClasses = `${baseClasses} ${pageNumberClasses} `;
                        if (isDisabled && !link.label.includes('...')) combinedClasses += disabledClasses; // Apply disabled only if not ellipsis
                        else if (isActive) combinedClasses += activeClasses;
                        else combinedClasses += defaultClasses;

                        if (isFirst) combinedClasses += ` ${firstLinkClasses}`;
                        if (isLast) combinedClasses += ` ${lastLinkClasses}`;
                        
                        // Special styling for ellipsis
                         if (link.label.includes('...')) {
                            return (
                                <span key={`separator-${index}`} className={`${baseClasses} ${defaultClasses} cursor-default px-3 sm:px-4`}>
                                   {labelContent}
                                </span>
                            );
                        }


                        return (
                            <Link
                                key={`link-${link.label}-${index}`}
                                href={link.url || '#'}
                                className={combinedClasses}
                                aria-current={isActive ? 'page' : undefined}
                                preserveScroll
                                // preserveState // Usually not needed for pagination
                                // only={['your_data_prop_name']} // Be specific about what data to reload
                                {...(isDisabled ? { as: 'span', tabIndex: -1, role: 'button', 'aria-disabled': true } : {})}
                            >
                                {labelContent}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
