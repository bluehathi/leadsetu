import React from 'react';

/**
 * A styled text-based logo component for "LeadSetu".
 * Uses Tailwind CSS for styling, including a gradient effect.
 *
 * @returns {JSX.Element} The rendered logo component.
 */
const Logo = () => {
  return (
    // Container for the logo
    <div className="inline-block">
      {/* Apply gradient, make text transparent, clip background to text */}
      <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-transparent bg-clip-text dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
        {/* You can adjust font weight or style parts differently if desired */}
        {/* Example: <span className="font-light">Lead</span><span className="font-bold">Setu</span> */}
        LeadSetu
      </span>
      {/* Optional: Add a subtle tagline or element */}
      {/* <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1 text-center">Connect & Grow</p> */}
    </div>
  );
};

export default Logo;

// --- How to use it in another component ---
/*
import React from 'react';
import Logo from './Logo'; // Adjust the import path

function SomeComponent() {
  return (
    <div>
      <Logo />
      { // Other content }
    </div>
  );
}

export default SomeComponent;
*/

// Full LeadSetu Logo SVG
export function LogoFull({ className = '', ...props }) {
    return (
        <svg
            className={className}
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <rect width="40" height="40" rx="10" fill="url(#leadsetu-gradient)" />
            <text x="50%" y="54%" textAnchor="middle" fontWeight="bold" fontSize="16" fill="#fff" fontFamily="Inter, Arial, sans-serif" dy=".3em">LeadSetu</text>
            <defs>
                <linearGradient id="leadsetu-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#a78bfa" />
                </linearGradient>
            </defs>
        </svg>
    );
}

// LS Monogram Logo SVG for collapsed sidebar
export function LogoLS({ className = '', ...props }) {
    return (
        <svg
            className={className}
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <rect width="40" height="40" rx="10" fill="url(#ls-gradient)" />
            <text x="50%" y="54%" textAnchor="middle" fontWeight="bold" fontSize="20" fill="#fff" fontFamily="Inter, Arial, sans-serif" dy=".3em">LS</text>
            <defs>
                <linearGradient id="ls-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#a78bfa" />
                </linearGradient>
            </defs>
        </svg>
    );
}
