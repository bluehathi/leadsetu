import { api } from './client';

// Thin CRUD wrapper around a /api/v1/<path> resource.
export const resource = (path) => ({
    list: (params) => api.get(`/${path}`, { params }).then((r) => r.data),
    get: (id) => api.get(`/${path}/${id}`).then((r) => r.data.data),
    create: (payload) => api.post(`/${path}`, payload).then((r) => r.data.data),
    update: (id, payload) => api.put(`/${path}/${id}`, payload).then((r) => r.data.data),
    remove: (id) => api.delete(`/${path}/${id}`),
});

export const companiesApi = resource('companies');
export const contactsApi = resource('contacts');
export const usersApi = resource('users');
export const rolesApi = resource('roles');
export const permissionsApi = { list: () => api.get('/permissions').then((r) => r.data) };

export const workspaceApi = {
    get: () => api.get('/workspace').then((r) => r.data.data),
    update: (payload) => api.put('/workspace', payload).then((r) => r.data.data),
};

export const smtpApi = {
    get: () => api.get('/settings/smtp').then((r) => r.data.data),
    update: (payload) => api.put('/settings/smtp', payload).then((r) => r.data.data),
    test: () => api.post('/settings/smtp/test').then((r) => r.data),
};
