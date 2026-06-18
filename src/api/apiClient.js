import { AnalyticsAdapter } from '../core/analytics/adapters/AnalyticsAdapter';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

const useMock = () => import.meta.env.VITE_DEV_MODE === 'true' || !import.meta.env.VITE_API_URL;
const MOCK_TOKEN = 'mock-session-token';

// --- Token refresh state ---
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
    refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken) {
    refreshSubscribers.forEach((cb) => cb(newToken));
    refreshSubscribers = [];
}

function getRefreshToken() {
    return localStorage.getItem('refreshToken');
}

function setTokens(token, refreshToken) {
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}

function clearTokens() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
}

async function doRefreshToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
        throw new Error('Refresh failed');
    }

    const data = await response.json();
    setTokens(data.token, data.refreshToken);
    return data.token;
}

const withAnalyticsMetadata = async (endpoint, body) => {
    if (endpoint !== '/auth/register' || !body || typeof body !== 'object' || Array.isArray(body)) {
        return body;
    }

    const analyticsMetadata = await AnalyticsAdapter.getRegistrationMetadata();

    if (!analyticsMetadata) {
        return body;
    }

    return {
        ...body,
        analyticsMetadata,
    };
};

const apiClient = async (endpoint, { body, ...customConfig } = {}) => {
    const requestBody = await withAnalyticsMetadata(endpoint, body);

    if (useMock()) {
        const { MOCK_HIERARCHY_DATA, user0profile } = await import('../utils/mockData');
        const token = localStorage.getItem('token');
        
        if (endpoint === '/auth/login' && customConfig.method === 'POST') {
            return {
                id: user0profile.id,
                name: requestBody?.email ? requestBody.email.split('@')[0] : user0profile.name,
                email: requestBody?.email || user0profile.email,
                token: MOCK_TOKEN,
                refreshToken: 'mock-refresh-token',
            };
        }
        if (endpoint === '/auth/register' && customConfig.method === 'POST') {
            return {
                id: `medic-${Date.now().toString(36)}`,
                name: requestBody?.name || user0profile.name,
                email: requestBody?.email || user0profile.email,
                token: MOCK_TOKEN,
                refreshToken: 'mock-refresh-token',
            };
        }
        if (endpoint === '/auth/refresh' && customConfig.method === 'POST') {
            return {
                token: MOCK_TOKEN,
                refreshToken: 'mock-refresh-token',
            };
        }
        if (endpoint === '/auth/me') {
            if (!token) {
                throw new Error('Unauthorized');
            }
            return {
                ...user0profile,
                token,
            };
        }
        if (endpoint.startsWith('/medics/')) {
            const parts = endpoint.split('/');
            const medicId = parts[2];
            if (parts.length === 3) {
                if (customConfig.method === 'DELETE') {
                    return {
                        deleted: true,
                        medicId,
                    };
                }
                if (customConfig.method === 'PUT') {
                    return {
                        ...user0profile,
                        id: medicId,
                        ...requestBody,
                    };
                }
                return user0profile;
            }
            if (parts[3] === 'patients') {
                const medic = MOCK_HIERARCHY_DATA.find(m => m.id === medicId) || MOCK_HIERARCHY_DATA[0];
                return medic ? medic.patients : [];
            }
            if (parts[3] === 'api-key' && parts[4] === 'rotate' && customConfig.method === 'POST') {
                return {
                    ...user0profile,
                    id: medicId,
                    apiKey: `dc_mock_${Date.now().toString(36)}`,
                    apiKeyMasked: 'dc_mock_...',
                    apiKeyLastRotatedAt: new Date().toISOString(),
                    apiKeyLastUsedAt: null,
                };
            }
        }
        if (endpoint.startsWith('/clinics/') && customConfig.method === 'PUT') {
            const parts = endpoint.split('/');
            const clinicId = parts[2];
            return {
                id: clinicId,
                displayId: `CLN-${clinicId.slice(-4).toUpperCase()}`,
                ...requestBody,
            };
        }
        if (endpoint === '/clinics/invitations/pending') {
            return [];
        }
        if (endpoint.startsWith('/clinics/') && endpoint.includes('/invitations') && customConfig.method === 'POST') {
            return {
                id: Date.now().toString(),
                status: 'pending',
                ...requestBody,
            };
        }
        if (endpoint.startsWith('/clinics/') && endpoint.includes('/members/') && customConfig.method === 'DELETE') {
            return { success: true };
        }
        if (endpoint.startsWith('/clinics/') && endpoint.endsWith('/ownership-transfer') && customConfig.method === 'POST') {
            return { success: true };
        }
        if (endpoint.startsWith('/clinics/') && customConfig.method === 'DELETE') {
            return { deleted: true };
        }
        if (endpoint.startsWith('/patients/')) {
            const parts = endpoint.split('/');
            const patientId = parts[2];
            
            for (const medic of MOCK_HIERARCHY_DATA) {
                const patient = medic.patients.find(p => String(p.id) === String(patientId));
                if (patient) return patient;
            }
            
            throw new Error(`Patient ${patientId} not found in mock data`);
        }

        const fallbackPaths = ['/auth/signup', '/patients'];
        if (customConfig.method === 'POST' || fallbackPaths.some(p => endpoint.includes(p))) {
            return { success: true, message: 'Mock action successful', id: Date.now().toString() };
        }

        throw new Error(`Mock endpoint not found: ${endpoint}`);
    }

    const makeRequest = async (token) => {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const config = {
            method: body ? 'POST' : 'GET',
            ...customConfig,
            headers: {
                ...headers,
                ...customConfig.headers,
            },
        };

        if (requestBody) {
            config.body = JSON.stringify(requestBody);
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        if (response.status === 204) {
            return null;
        }

        let data;
        try {
            data = await response.json();
        } catch {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
        }

        if (response.ok) {
            return data;
        }

        throw new Error(data?.error || data?.message || response.statusText);
    };

    try {
        const token = localStorage.getItem('token');
        return await makeRequest(token);
    } catch (err) {
        if (err.message === 'Invalid or expired token' || err.message === 'Unauthorized: No token provided') {
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    const newToken = await doRefreshToken();
                    isRefreshing = false;
                    onTokenRefreshed(newToken);
                    return await makeRequest(newToken);
                } catch (refreshErr) {
                    isRefreshing = false;
                    clearTokens();
                    window.location.href = '/';
                    throw refreshErr;
                }
            } else {
                return new Promise((resolve, reject) => {
                    subscribeTokenRefresh((newToken) => {
                        makeRequest(newToken).then(resolve).catch(reject);
                    });
                });
            }
        }
        throw err;
    }
};

export default apiClient;
export { clearTokens, setTokens, getRefreshToken };
