import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In dev, /api and /sanctum are proxied to Laravel so the SPA and API share
// an origin (required for Sanctum cookie authentication).
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 5173,
        proxy: {
            '/api': { target: process.env.VITE_API_URL ?? 'http://localhost:8000', changeOrigin: false },
            '/sanctum': { target: process.env.VITE_API_URL ?? 'http://localhost:8000', changeOrigin: false },
        },
    },
});
