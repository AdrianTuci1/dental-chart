const { NO_STORE, cacheControlFor } = require('../src/http/staticPolicy');

/**
 * The zone is on Cloudflare, so this module decides what the edge is allowed to keep.
 * Only the built frontend may be cached, and nothing that answers with patient data.
 */
describe('cache policy', () => {
    describe('built frontend, cacheable', () => {
        it('pins hashed Vite output forever', () => {
            expect(cacheControlFor('/assets/index-CefHpqIS.js'))
                .toBe('public, max-age=31536000, immutable');
        });

        it('gives hand-managed static files an hour and a revalidation', () => {
            expect(cacheControlFor('/static/logo.png'))
                .toBe('public, max-age=3600, must-revalidate');
            expect(cacheControlFor('/static/teeth/11_outside_standard.png'))
                .toBe('public, max-age=3600, must-revalidate');
        });
    });

    describe('everything else, revalidated', () => {
        it('keeps documents out of the cache so a deploy is visible at once', () => {
            expect(cacheControlFor('/')).toBe('no-cache');
            expect(cacheControlFor('/index.html')).toBe('no-cache');
            expect(cacheControlFor('/patients/123')).toBe('no-cache');
        });

        it('does not pin build output that carries no content hash', () => {
            expect(cacheControlFor('/assets/logo.png')).toBe('no-cache');
            expect(cacheControlFor('/assets/index.js')).toBe('no-cache');
        });

        it('treats the assets the API serves as uncacheable, extension or not', () => {
            // Cloudflare caches .png by extension without any rule, so this path would be
            // cached at the edge if the API did not answer with no-store.
            expect(cacheControlFor('/api/ai/assets/chart2.png')).toBe('no-cache');
            expect(cacheControlFor('/api/patients/123')).toBe('no-cache');
        });
    });

    it('marks every API answer no-store', () => {
        expect(NO_STORE).toBe('no-store');
    });
});
