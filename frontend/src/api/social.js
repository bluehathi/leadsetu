import { api } from './client';

export const socialApi = {
    overview: (platform) => api.get('/social/overview', { params: platform ? { platform } : {} }).then((r) => r.data.data),

    listAccounts: (params) => api.get('/social/accounts', { params }).then((r) => r.data.data),
    createAccount: (payload) => api.post('/social/accounts', payload).then((r) => r.data.data),
    updateAccount: (id, payload) => api.put(`/social/accounts/${id}`, payload).then((r) => r.data.data),
    syncAccount: (id) => api.post(`/social/accounts/${id}/sync`).then((r) => r.data.data),
    syncAllAccounts: () => api.post('/social/accounts/sync-all').then((r) => r.data.data),
    getOAuthUrl: (platform) => api.get(`/social/oauth/${platform}/url`).then((r) => r.data.data),
    deleteAccount: (id) => api.delete(`/social/accounts/${id}`),

    listContents: (params) => api.get('/social/contents', { params }).then((r) => r.data.data),
    createContent: (payload) => api.post('/social/contents', payload).then((r) => r.data.data),
    updateContent: (id, payload) => api.put(`/social/contents/${id}`, payload).then((r) => r.data.data),
    deleteContent: (id) => api.delete(`/social/contents/${id}`),
    optimizeContent: (payload) => api.post('/social/contents/optimize', payload).then((r) => r.data.data),

    listKeywords: (params) => api.get('/social/keywords', { params }).then((r) => r.data.data),
    analyzeKeyword: (payload) => api.post('/social/keywords/analyze', payload).then((r) => r.data.data),
    deleteKeyword: (id) => api.delete(`/social/keywords/${id}`),

    listCompetitors: (params) => api.get('/social/competitors', { params }).then((r) => r.data.data),
    createCompetitor: (payload) => api.post('/social/competitors', payload).then((r) => r.data.data),
    deleteCompetitor: (id) => api.delete(`/social/competitors/${id}`),

    listIdeas: (params) => api.get('/social/ideas', { params }).then((r) => r.data.data),
    generateIdeas: (payload) => api.post('/social/ideas/generate', payload).then((r) => r.data.data),
    updateIdeaStatus: (id, status) => api.patch(`/social/ideas/${id}/status`, { status }).then((r) => r.data.data),
    convertIdea: (id, social_account_id) => api.post(`/social/ideas/${id}/convert`, { social_account_id }).then((r) => r.data.data),
};
