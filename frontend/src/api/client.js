import axios from 'axios';

// Same-origin requests (dev proxy / production reverse proxy) with Sanctum cookie auth.
export const api = axios.create({
    baseURL: '/api/v1',
    withCredentials: true,
    withXSRFToken: true,
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
});

// Sanctum requires fetching the CSRF cookie before the first state-changing request.
export const csrf = () => axios.get('/sanctum/csrf-cookie', { withCredentials: true });
