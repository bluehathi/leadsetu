import { api, csrf } from './client';

export const getMe = () => api.get('/me').then((r) => r.data.data);
export const login = async (payload) => {
    await csrf();
    return api.post('/auth/login', payload);
};
export const logout = () => api.post('/auth/logout');
