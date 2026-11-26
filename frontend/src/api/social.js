import { api } from './client';

export const socialApi = {
    overview: (platform) => api.get('/social/overview', { params: platform ? { platform } : {} }).then((r) => r.data.data),

    listBrands: () => api.get('/social/brands').then((r) => r.data.data),
    getBrandAnalytics: (id, refresh = false) =>
        api.get(`/social/brands/${id}/analytics`, { params: refresh ? { refresh: 1 } : {} }).then((r) => r.data.data),
    createBrand: (payload) => api.post('/social/brands', payload).then((r) => r.data.data),
    updateBrand: (id, payload) => api.put(`/social/brands/${id}`, payload).then((r) => r.data.data),
    deleteBrand: (id) => api.delete(`/social/brands/${id}`),

    listAccounts: (params) => api.get('/social/accounts', { params }).then((r) => r.data.data),
    getAccountAnalytics: (id, refresh = false) =>
        api.get(`/social/accounts/${id}/analytics`, { params: refresh ? { refresh: 1 } : {} }).then((r) => r.data.data),
    getVideoAnalytics: (accountId, videoId, refresh = false) =>
        api
            .get(`/social/accounts/${accountId}/videos/${videoId}/analytics`, { params: refresh ? { refresh: 1 } : {} })
            .then((r) => r.data.data),
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
    shareContent: (id, payload) => api.post(`/social/contents/${id}/share`, payload).then((r) => r.data.data),
    updateFirstComment: (id, payload) => api.post(`/social/contents/${id}/first-comment`, payload).then((r) => r.data.data),
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

    getDriveStatus: () => api.get('/social/drive/status').then((r) => r.data.data),
    getDriveOAuthUrl: () => api.get('/social/drive/oauth/url').then((r) => r.data.data),
    listDriveFiles: (params) => api.get('/social/drive/files', { params }).then((r) => r.data.data),
    toggleDriveFavorite: (folder_id, folder_name) =>
        api.post('/social/drive/favorites', { folder_id, folder_name }).then((r) => r.data.data),
    setDriveDefaultFolder: (folder_id, folder_name) =>
        api.post('/social/drive/default-folder', { folder_id, folder_name }).then((r) => r.data.data),
    setDriveFolderLock: (locked, password = null) =>
        api.post('/social/drive/lock-folder', { locked, ...(password ? { password } : {}) }).then((r) => r.data.data),
    disconnectDrive: () => api.delete('/social/drive/disconnect'),
    publishFromDrive: (contentId, privacy_status = 'private') =>
        api.post(`/social/contents/${contentId}/publish-from-drive`, { privacy_status }).then((r) => r.data.data),
};
