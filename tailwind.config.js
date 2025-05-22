/** @type {import('tailwindcss').Config} */
export default { // Use 'export default' instead of 'module.exports'
    content: [
      "./resources/**/*.blade.php",
      "./resources/**/*.js",
      "./resources/**/*.vue", // Keep if you might use Vue
      "./resources/**/*.jsx", // Correctly includes React JSX files
      // "./resources/**/*.tsx", // Keep if you might use TypeScript JSX
      // "./resources/**/*.css", // Usually not needed here, Tailwind scans JS/JSX/Blade for classes
    ],
    theme: {
      extend: {
        // Add any theme customizations here
      },
    },
    plugins: [
      // Add any Tailwind plugins here (e.g., require('@tailwindcss/forms'))
      // If using plugins like @tailwindcss/forms, you might need to import them:
      // import forms from '@tailwindcss/forms';
      // plugins: [forms],
    ],
  };
  