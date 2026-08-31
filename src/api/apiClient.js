import { AnalyticsAdapter } from '../core/analytics/adapters/AnalyticsAdapter';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

const useMock = () => import.meta.env.VITE_DEV_MODE === 'true' || !import.meta.env.VITE_API_URL;
const MOCK_TOKEN = 'mock-session-token';

// --- Token refresh state ---
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(onSuccess, onFailure) {
    refreshSubscribers.push({ onSuccess, onFailure });
}

function takeSubscribers() {
    const pending = refreshSubscribers;
    refreshSubscribers = [];
    return pending;
}

function onTokenRefreshed(newToken) {
    takeSubscribers().forEach(({ onSuccess }) => onSuccess(newToken));
}

// Requests that queued behind the refresh must fail too, otherwise their promises
// would never settle and the page would stay stuck in a loading state.
function onTokenRefreshFailed(error) {
    takeSubscribers().forEach(({ onFailure }) => onFailure(error));
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
    if (!refreshToken) {
        throw Object.assign(new Error('No refresh token'), { endsSession: true });
    }

    let response;
    try {
        response = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });
    } catch {
        // The request never reached the API. The tokens are still valid, so the
        // session must survive and the caller can simply retry.
        throw Object.assign(new Error('Refresh failed'), { retryable: true });
    }

    if (!response.ok) {
        // Only the API can end a session: 401/403 means the refresh token is expired,
        // revoked or reused. A 5xx stays retryable instead of logging everyone out.
        const endsSession = response.status === 401 || response.status === 403;
        throw Object.assign(new Error('Refresh failed'), { status: response.status, endsSession });
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
        if (endpoint === '/auth/google' && customConfig.method === 'POST') {
            if (!requestBody?.idToken) {
                throw new Error('Google did not return a credential');
            }

            return {
                id: user0profile.id,
                name: user0profile.name,
                email: user0profile.email,
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
            const { getWorkspaceProfileFields } = await import('./mockWorkspaces');
            return {
                ...user0profile,
                ...getWorkspaceProfileFields(user0profile),
                token,
            };
        }
        if (endpoint.startsWith('/medics/')) {
            const [medicsPath, medicsQuery] = endpoint.split('?');
            const requestedClinicId = medicsQuery ? new URLSearchParams(medicsQuery).get('clinicId') : null;
            const parts = medicsPath.split('/');
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
                const { filterMockPatients } = await import('./mockWorkspaces');
                const medic = MOCK_HIERARCHY_DATA.find(m => m.id === medicId) || MOCK_HIERARCHY_DATA[0];
                return medic ? filterMockPatients(user0profile, medic.patients, requestedClinicId) : [];
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
        if (endpoint === '/clinics' && customConfig.method === 'POST') {
            const { createMockWorkspace } = await import('./mockWorkspaces');
            return createMockWorkspace(user0profile, requestBody);
        }
        if (endpoint.startsWith('/clinics/') && customConfig.method === 'PUT') {
            const { updateMockWorkspace } = await import('./mockWorkspaces');
            const clinicId = endpoint.split('/')[2];
            return updateMockWorkspace(user0profile, clinicId, requestBody);
        }
        if (endpoint === '/clinics/invitations/pending') {
            return [];
        }
        if (endpoint.startsWith('/clinics/') && endpoint.includes('/invitations') && customConfig.method === 'POST') {
            const { inviteMockMember } = await import('./mockWorkspaces');
            const clinicId = endpoint.split('/')[2];
            return inviteMockMember(user0profile, clinicId, requestBody);
        }
        if (endpoint.startsWith('/clinics/') && endpoint.includes('/members/') && customConfig.method === 'DELETE') {
            return { success: true };
        }
        if (endpoint.startsWith('/clinics/') && endpoint.endsWith('/ownership-transfer') && customConfig.method === 'POST') {
            return { success: true };
        }
        if (endpoint.startsWith('/clinics/') && customConfig.method === 'DELETE') {
            const { deleteMockWorkspace } = await import('./mockWorkspaces');
            const clinicId = endpoint.split('/')[2];
            return deleteMockWorkspace(user0profile, clinicId);
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
                    onTokenRefreshFailed(refreshErr);
                    if (refreshErr.endsSession) {
                        clearTokens();
                        window.location.href = '/';
                    }
                    throw refreshErr;
                }
            } else {
                return new Promise((resolve, reject) => {
                    subscribeTokenRefresh(
                        (newToken) => {
                            makeRequest(newToken).then(resolve).catch(reject);
                        },
                        reject,
                    );
                });
            }
        }
        throw err;
    }
};

export default apiClient;
export { clearTokens, setTokens, getRefreshToken };
