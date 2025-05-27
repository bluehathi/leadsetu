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
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' }, // Subtle Y translation
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.4s ease-out forwards', // Faster animation
      },
    },
    },
    plugins: [
      // Add any Tailwind plugins here (e.g., require('@tailwindcss/forms'))
      // If using plugins like @tailwindcss/forms, you might need to import them:
      // import forms from '@tailwindcss/forms';
      // plugins: [forms],
    ],
  };
  