import { api, csrf } from './client';

export const getMe = () => api.get('/me').then((r) => r.data.data);
export const login = async (payload) => {
    await csrf();
    return api.post('/auth/login', payload);
};
export const register = async (payload) => {
    await csrf();
    return api.post('/auth/register', payload).then((r) => r.data.data);
};
export const logout = () => api.post('/auth/logout');
export const forgotPassword = async (email) => {
    await csrf();
    return api.post('/auth/forgot-password', { email }).then((r) => r.data);
};
export const resetPassword = async (payload) => {
    await csrf();
    return api.post('/auth/reset-password', payload).then((r) => r.data);
};
export const resendVerification = () => api.post('/auth/email/verification-notification').then((r) => r.data);
export const updateProfile = (payload) => api.put('/me', payload).then((r) => r.data.data);
export const changePassword = (payload) => api.put('/me/password', payload).then((r) => r.data);
