/**
 * Cache policy for what this server hands to browsers, in both deploy shapes: the bundled
 * Lambda (dist/ inside the function package) and the Cloudflare Worker (static assets
 * binding). Keeping the rule here means the two hosts answer with the same headers
 * instead of drifting apart.
 *
 * Only the built frontend is cacheable. Everything the API answers is marked no-store,
 * see NO_STORE below.
 *
 * /assets/*        -> Vite output, content hashed, safe to pin forever
 * /static/*        -> hand-managed files from public/static, names never change
 * documents (HTML) -> revalidate, so a deploy is visible immediately
 */
const STATIC_PREFIX = '/static';
const IMMUTABLE_BUILD_ASSET = /^\/assets\/.+-[A-Za-z0-9_-]{8}\.(js|css)$/;

/**
 * For answers that must never be kept by anything between the app and the browser:
 * everything under /api/*, which carries patient data or a session, and /health, which
 * has to report the state of right now.
 *
 * The zone is on Cloudflare, and Cloudflare caches by file extension on its own, which is
 * enough to cache /api/ai/assets/chart2.png with no cache rule configured at all. This
 * header is the part that makes "cache the build, never the API" hold regardless of how
 * the rules are written, and it also covers any other proxy that ends up in the path.
 */
const NO_STORE = 'no-store';

const cacheControlFor = (pathname = '/') => {
    if (IMMUTABLE_BUILD_ASSET.test(pathname)) {
        return 'public, max-age=31536000, immutable';
    }

    if (pathname.startsWith(`${STATIC_PREFIX}/`)) {
        return 'public, max-age=3600, must-revalidate';
    }

    return 'no-cache';
};

module.exports = {
    STATIC_PREFIX,
    NO_STORE,
    cacheControlFor,
};
