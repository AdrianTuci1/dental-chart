import { beforeEach, describe, expect, it } from 'vitest';
import apiClient from '../apiClient';

describe('apiClient mock auth behavior', () => {
    beforeEach(() => {
        const storage = new Map();
        globalThis.localStorage = {
            getItem: (key) => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, String(value)),
            removeItem: (key) => storage.delete(key),
            clear: () => storage.clear(),
        };

        globalThis.localStorage.clear();
        import.meta.env.VITE_DEV_MODE = 'true';
        import.meta.env.VITE_API_URL = undefined;
    });

    it('rejects /auth/me when no token is present in mock mode', async () => {
        await expect(apiClient('/auth/me')).rejects.toThrow('Unauthorized');
    });

    it('returns the current user in mock mode when a token is present', async () => {
        localStorage.setItem('token', 'mock-session-token');

        const user = await apiClient('/auth/me');

        expect(user.id).toBeTruthy();
        expect(user.token).toBe('mock-session-token');
    });
});
