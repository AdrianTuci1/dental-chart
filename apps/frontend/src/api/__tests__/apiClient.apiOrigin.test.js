import { beforeEach, describe, expect, it, vi } from 'vitest';

const seedStorage = (seed = {}) => {
    const store = new Map(Object.entries(seed));
    globalThis.localStorage = {
        getItem: (key) => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => store.set(key, String(value)),
        removeItem: (key) => store.delete(key),
        clear: () => store.clear(),
    };
};

const okResponse = () => new Response(JSON.stringify({ id: 'm-1' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
});

const loadApiClient = async () => (await import('../apiClient')).default;

describe('apiClient API origin', () => {
    beforeEach(() => {
        vi.resetModules();
        seedStorage({ token: 'access-token' });
        globalThis.fetch = vi.fn(async () => okResponse());
    });

    it('keeps requests relative when the API shares the app origin', async () => {
        import.meta.env.VITE_DEV_MODE = 'false';
        import.meta.env.VITE_API_URL = 'self';

        await (await loadApiClient())('/auth/me');

        expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
        }));
    });

    it('uses the configured origin when one is given', async () => {
        import.meta.env.VITE_DEV_MODE = 'false';
        import.meta.env.VITE_API_URL = 'https://api.example.test';

        await (await loadApiClient())('/auth/me');

        expect(globalThis.fetch).toHaveBeenCalledWith(
            'https://api.example.test/api/auth/me',
            expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer access-token' }) }),
        );
    });
});
