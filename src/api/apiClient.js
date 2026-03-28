const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

/**
 * Generic API client wrapper around fetch.
 * Handles:
 * - Base URL prepending
 * - JSON headers
 * - Auth token injection
 * - Error handling
 */
const useMock = () => !import.meta.env.VITE_API_URL;

/**
 * Generic API client wrapper around fetch.
 */
const apiClient = async (endpoint, { body, ...customConfig } = {}) => {
    if (useMock()) {
        console.log(`[MockAPI] ${customConfig.method || (body ? 'POST' : 'GET')} ${endpoint}`);
        const { MOCK_HIERARCHY_DATA, user0profile } = await import('../utils/mockData');
        
        // Simple mock routing
        if (endpoint === '/auth/me') return user0profile;
        if (endpoint.startsWith('/medics/')) {
            const parts = endpoint.split('/');
            const medicId = parts[2];
            if (parts.length === 3) {
                // GET /medics/:id
                return user0profile; // For now return default profile
            }
            if (parts[3] === 'patients') {
                // GET /medics/:id/patients
                const medic = MOCK_HIERARCHY_DATA.find(m => m.id === medicId) || MOCK_HIERARCHY_DATA[0];
                return medic ? medic.patients : [];
            }
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
        const fallbackPaths = ['/auth/login', '/auth/signup', '/patients'];
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

    if (body) {
        config.body = JSON.stringify(body);
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
