import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Icons for prev/next

/**
 * Renders pagination links provided by Laravel's Paginator.
 * It expects the 'links' array which includes URLs, labels, and active/disabled states.
 *
 * @param {object} props
 * @param {Array} props.links - The links array from the Laravel Paginator object. Each link object typically has 'url', 'label', 'active'.
 * @param {string} [props.className=''] - Optional additional CSS classes for the main nav container.
 * @returns {JSX.Element|null} The pagination component or null if no links need to be rendered.
 */
export default function Pagination({ links = [], className = '' }) {
    // Don't render the component if there are 3 or fewer links
    // (typically means only one page: just prev, page 1, next)
    if (!links || links.length <= 3) {
        return null;
    }

    return (
        // Main navigation container
        <nav
            className={`flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 ${className}`}
            aria-label="Pagination"
        >
            {/* Placeholder for "Showing X to Y of Z results" - requires 'meta' data from paginator */}
            {/* <div className="hidden sm:block">
                <p className="text-sm text-gray-700 dark:text-gray-400">
                    Showing <span className="font-medium">{meta.from || 0}</span> to <span className="font-medium">{meta.to || 0}</span> of{' '}
                    <span className="font-medium">{meta.total || 0}</span> results
                </p>
            </div> */}

            {/* Container for the pagination links, aligned to the right on larger screens */}
            <div className="flex flex-1 justify-between sm:justify-end">
                <div className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {/* Map through each link object provided by Laravel Paginator */}
                    {links.map((link, index) => {
                        // Determine the state of the link
                        const isFirst = index === 0; // Is it the 'Previous' link?
                        const isLast = index === links.length - 1; // Is it the 'Next' link?
                        const isDisabled = !link.url; // Is the link disabled (no URL)?
                        const isActive = link.active; // Is it the currently active page number?

                        // Set the label: use icons for Prev/Next, otherwise use the label from Laravel (might contain HTML entities)
                        let labelContent;
                        if (isFirst) {
                            labelContent = <ChevronLeft size={18} aria-hidden="true" />;
                        } else if (isLast) {
                            labelContent = <ChevronRight size={18} aria-hidden="true" />;
                        } else {
                            // Use dangerouslySetInnerHTML for labels like '1', '2', '&raquo;', etc.
                            labelContent = <span dangerouslySetInnerHTML={{ __html: link.label }} />;
                        }

                        // Define base styling classes
                        const baseClasses = "relative inline-flex items-center px-4 py-2 border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition ease-in-out duration-150";
                        // Define classes for different states
                        const activeClasses = "z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200";
                        const defaultClasses = "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700";
                        const disabledClasses = "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-300 dark:text-gray-500 cursor-not-allowed";
                        // Define classes for rounded corners on first/last elements
                        const firstClasses = "rounded-l-md";
                        const lastClasses = "rounded-r-md";

                        // Combine classes based on the link's state
                        let combinedClasses = `${baseClasses} `;
                        if (isDisabled) combinedClasses += disabledClasses;
                        else if (isActive) combinedClasses += activeClasses;
                        else combinedClasses += defaultClasses;

                        // Add rounding for the first and last visible links
                        if (isFirst) combinedClasses += ` ${firstClasses}`;
                        if (isLast) combinedClasses += ` ${lastClasses}`;

                        // Handle rendering '...' separator (usually has null URL and label containing '...')
                        if (link.label.includes('...')) {
                            return (
                                <span key={`separator-${index}`} className={`${baseClasses} ${defaultClasses} cursor-default`}>
                                    ...
                                </span>
                            );
                        }

                        // Return the Inertia Link component for clickable links
                        return (
                            <Link
                                key={`link-${link.label}-${index}`} // Create a unique key
                                href={link.url || '#'} // Use URL if available, otherwise '#'
                                className={combinedClasses}
                                aria-current={isActive ? 'page' : undefined} // Indicate active page for accessibility
                                preserveScroll // Maintain scroll position on page change
                                // preserveState // Optionally maintain component state
                                only={['leads']} // Important: Only request updated 'leads' data to optimize performance
                                {...(isDisabled ? { as: 'span', tabIndex: -1 } : {})} // Render disabled links as non-interactive spans
                            >
                                {labelContent} {/* Render the icon or text label */}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
