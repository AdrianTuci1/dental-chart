import { AnalyticsAdapter } from '../core/analytics/adapters/AnalyticsAdapter';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

/**
 * Generic API client wrapper around fetch.
 * Handles:
 * - Base URL prepending
 * - JSON headers
 * - Auth token injection
 * - Error handling
 */
const useMock = () => import.meta.env.VITE_DEV_MODE === 'true' || !import.meta.env.VITE_API_URL;
const MOCK_TOKEN = 'mock-session-token';

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

/**
 * Generic API client wrapper around fetch.
 */
const apiClient = async (endpoint, { body, ...customConfig } = {}) => {
    const requestBody = await withAnalyticsMetadata(endpoint, body);

    if (useMock()) {
        console.log(`[MockAPI] ${customConfig.method || (requestBody ? 'POST' : 'GET')} ${endpoint}`);
        const { MOCK_HIERARCHY_DATA, user0profile } = await import('../utils/mockData');
        const token = localStorage.getItem('token');
        
        // Simple mock routing
        if (endpoint === '/auth/login' && customConfig.method === 'POST') {
            return {
                id: user0profile.id,
                name: requestBody?.email ? requestBody.email.split('@')[0] : user0profile.name,
                email: requestBody?.email || user0profile.email,
                token: MOCK_TOKEN,
            };
        }
        if (endpoint === '/auth/register' && customConfig.method === 'POST') {
            return {
                id: `medic-${Date.now().toString(36)}`,
                name: requestBody?.name || user0profile.name,
                email: requestBody?.email || user0profile.email,
                token: MOCK_TOKEN,
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
                // GET /medics/:id
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
                return user0profile; // For now return default profile
            }
            if (parts[3] === 'patients') {
                // GET /medics/:id/patients
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
            
            // If not found in mock, return 404 error
            throw new Error(`Patient ${patientId} not found in mock data`);
        }

        // Default fallback for mock
        const fallbackPaths = ['/auth/signup', '/patients'];
        if (customConfig.method === 'POST' || fallbackPaths.some(p => endpoint.includes(p))) {
            return { success: true, message: 'Mock action successful', id: Date.now().toString() };
        }

        throw new Error(`Mock endpoint not found: ${endpoint}`);
    }

    const headers = {
        'Content-Type': 'application/json',
    };
    // ... rest of the fetch logic ...

    const token = localStorage.getItem('token');
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

    let data;
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        // Handle 204 No Content
        if (response.status === 204) {
            return null;
        }

        try {
            data = await response.json();
        } catch {
            // If response is not JSON (e.g. 500 error html), return text or status text
            if (!response.ok) {
                throw new Error(response.statusText);
            }
        }

        if (response.ok) {
            return data;
        }

        throw new Error(data?.error || data?.message || response.statusText);
    } catch (err) {
        return Promise.reject(err.message ? err.message : data);
    }
};

export default apiClient;
