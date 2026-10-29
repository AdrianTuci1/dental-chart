import apiClient from './apiClient';

export const systemService = {
    getConfig: () => apiClient('/config'),
    sendTestEmail: () => apiClient('/config/test-email', { method: 'POST' }),
};
