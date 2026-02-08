const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Generic API client wrapper around fetch.
 * Handles:
 * - Base URL prepending
 * - JSON headers
 * - Auth token injection
 * - Error handling
 */
const apiClient = async (endpoint, { body, ...customConfig } = {}) => {
    const headers = {
        'Content-Type': 'application/json',
    };

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
        } catch (error) {
            // If response is not JSON (e.g. 500 error html), return text or status text
            if (!response.ok) {
                throw new Error(response.statusText);
            }
        }

        if (response.ok) {
            return data;
        }

        throw new Error(data?.message || response.statusText);
    } catch (err) {
        return Promise.reject(err.message ? err.message : data);
    }
};

export default apiClient;
