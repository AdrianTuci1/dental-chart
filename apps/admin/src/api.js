const CONFIGURED_API_URL = import.meta.env.VITE_API_URL;
const API_ORIGIN = CONFIGURED_API_URL === 'self'
    ? ''
    : (CONFIGURED_API_URL || 'http://localhost:3100');

const request = async (path, { method = 'GET', token, body } = {}) => {
    const response = await fetch(`${API_ORIGIN}/api${path}`, {
        method,
        headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) {
        return null;
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        const error = new Error(payload?.error || `Request failed with status ${response.status}`);
        error.status = response.status;
        throw error;
    }

    return payload;
};

export const adminApi = {
    login: (email, password) => request('/auth/login', {
        method: 'POST',
        body: { email, password },
    }),

    refresh: (refreshToken) => request('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
    }),

    listAccounts: (token) => request('/admin/accounts', { token }),

    setStatus: (token, medicId, status) => request(`/admin/accounts/${medicId}`, {
        method: 'PATCH',
        token,
        body: { status },
    }),

    deleteAccount: (token, medicId) => request(`/admin/accounts/${medicId}`, {
        method: 'DELETE',
        token,
    }),
};
