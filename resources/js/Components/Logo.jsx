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
