import { beforeEach, describe, expect, it, vi } from 'vitest';

// The session must survive anything that is not the API saying "this token is dead":
// a dropped connection, a restarting backend, a 502 from the proxy.
const REFRESH_ENDPOINT = 'http://api.test/api/auth/refresh';

const storage = new Map();

const seedSession = () => {
    storage.clear();
    storage.set('token', 'expired-access-token');
    storage.set('refreshToken', 'refresh-token-1');
};

const jsonResponse = (status, body) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
});

const loadApiClient = async () => {
    vi.resetModules();
    const module = await import('../apiClient');
    return module.default;
};

describe('apiClient keeps the session on transient failures', () => {
    beforeEach(() => {
        globalThis.localStorage = {
            getItem: (key) => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, String(value)),
            removeItem: (key) => storage.delete(key),
            clear: () => storage.clear(),
        };

        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { href: 'http://app.test/patients' },
        });

        import.meta.env.VITE_DEV_MODE = 'false';
        import.meta.env.VITE_API_URL = 'http://api.test';
        globalThis.fetch = vi.fn();
        seedSession();
    });

    it('clears the session when the API rejects the refresh token', async () => {
        const apiClient = await loadApiClient();

        globalThis.fetch.mockImplementation(async (url) =>
            String(url).startsWith(REFRESH_ENDPOINT)
                ? jsonResponse(401, { error: 'Invalid or expired refresh token', reason: 'expired' })
                : jsonResponse(401, { error: 'Invalid or expired token' })
        );

        await expect(apiClient('/medics/medic-1/patients')).rejects.toThrow();

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('refreshToken')).toBeNull();
        expect(window.location.href).toBe('/');
    });

    it('keeps the session when the refresh endpoint returns a server error', async () => {
        const apiClient = await loadApiClient();

        globalThis.fetch.mockImplementation(async (url) =>
            String(url).startsWith(REFRESH_ENDPOINT)
                ? jsonResponse(500, { error: 'boom' })
                : jsonResponse(401, { error: 'Invalid or expired token' })
        );

        await expect(apiClient('/medics/medic-1/patients')).rejects.toThrow('Refresh failed');

        expect(localStorage.getItem('refreshToken')).toBe('refresh-token-1');
        expect(localStorage.getItem('token')).toBe('expired-access-token');
        expect(window.location.href).toBe('http://app.test/patients');
    });

    it('keeps the session when the browser cannot reach the API at all', async () => {
        const apiClient = await loadApiClient();

        globalThis.fetch.mockImplementation(async (url) => {
            if (String(url).startsWith(REFRESH_ENDPOINT)) {
                throw new TypeError('Failed to fetch');
            }
            return jsonResponse(401, { error: 'Invalid or expired token' });
        });

        await expect(apiClient('/medics/medic-1/patients')).rejects.toThrow('Refresh failed');

        expect(localStorage.getItem('refreshToken')).toBe('refresh-token-1');
        expect(window.location.href).toBe('http://app.test/patients');
    });

    it('stores the rotated pair after a successful refresh', async () => {
        const apiClient = await loadApiClient();

        globalThis.fetch.mockImplementation(async (url) => {
            if (String(url).startsWith(REFRESH_ENDPOINT)) {
                return jsonResponse(200, { token: 'fresh-access', refreshToken: 'refresh-token-2' });
            }
            if (url.endsWith('/patients') && localStorage.getItem('token') === 'expired-access-token') {
                return jsonResponse(401, { error: 'Invalid or expired token' });
            }
            return jsonResponse(200, []);
        });

        const patients = await apiClient('/medics/medic-1/patients');

        expect(patients).toEqual([]);
        expect(localStorage.getItem('token')).toBe('fresh-access');
        expect(localStorage.getItem('refreshToken')).toBe('refresh-token-2');
    });
});
