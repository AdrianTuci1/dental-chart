/**
 * Verifies Google ID tokens with WebCrypto and Google's published JWKS.
 *
 * `google-auth-library` would do the same, but it drags in Node HTTP internals that the
 * Cloudflare Worker runtime and the Lambda package should not carry. The JWKS response
 * is cached for as long as Google says it may be, so the common path makes no request.
 *
 * Signatures are checked with RSASSA-PKCS1-v1_5 + SHA-256 over `header.payload`, which
 * is what an RS256 ID token is. Anything else is rejected instead of trusted.
 */
const crypto = globalThis.crypto;

const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ALLOWED_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);
const DEFAULT_CACHE_MS = 60 * 60 * 1000;
const CLOCK_SKEW_SECONDS = 60;

let cachedKeys = null;

const decodeJsonSegment = (segment) => JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));

const cacheMaxAgeMs = (response) => {
    const maxAge = /max-age=(\d+)/i.exec(response.headers.get('cache-control') || '');
    return maxAge ? Number(maxAge[1]) * 1000 : DEFAULT_CACHE_MS;
};

const loadKeys = async ({ forceRefresh = false } = {}) => {
    const now = Date.now();

    if (!forceRefresh && cachedKeys && cachedKeys.expiresAt > now) {
        return cachedKeys.keys;
    }

    const response = await fetch(JWKS_URL);

    if (!response.ok) {
        throw new Error(`Google keys endpoint responded ${response.status}`);
    }

    const body = await response.json();

    if (!Array.isArray(body?.keys) || body.keys.length === 0) {
        throw new Error('Google keys endpoint returned no keys');
    }

    cachedKeys = {
        keys: body.keys,
        expiresAt: now + cacheMaxAgeMs(response),
    };

    return cachedKeys.keys;
};

const importKey = (jwk) => crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
);

const assertClaims = (payload, audience) => {
    const now = Math.floor(Date.now() / 1000);

    if (!ALLOWED_ISSUERS.has(payload.iss)) {
        throw new Error('Unexpected issuer');
    }

    if (payload.aud !== audience) {
        throw new Error('Token was issued for another client');
    }

    if (typeof payload.exp !== 'number' || payload.exp + CLOCK_SKEW_SECONDS < now) {
        throw new Error('Token expired');
    }

    if (typeof payload.nbf === 'number' && payload.nbf - CLOCK_SKEW_SECONDS > now) {
        throw new Error('Token is not valid yet');
    }
};

const verifySignature = async (idToken) => {
    const segments = String(idToken).split('.');

    if (segments.length !== 3) {
        throw new Error('Token is not a JWT');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = segments;
    const header = decodeJsonSegment(encodedHeader);

    if (header.alg !== 'RS256') {
        throw new Error(`Unsupported algorithm: ${header.alg}`);
    }

    const signingInput = Buffer.from(`${encodedHeader}.${encodedPayload}`, 'utf8');
    const signature = Buffer.from(encodedSignature, 'base64url');

    let keys = await loadKeys();
    let jwk = keys.find((key) => key.kid === header.kid);

    // Google rotates keys; an unknown kid means the cached set is stale, so refresh once.
    if (!jwk) {
        keys = await loadKeys({ forceRefresh: true });
        jwk = keys.find((key) => key.kid === header.kid);
    }

    if (!jwk) {
        throw new Error('No matching signing key');
    }

    const key = await importKey(jwk);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signingInput);

    if (!valid) {
        throw new Error('Signature does not match');
    }

    return decodeJsonSegment(encodedPayload);
};

/**
 * Same surface as the google-auth-library client the service used before, so callers and
 * tests keep working: `verifyIdToken({ idToken, audience })` resolves to a ticket whose
 * `getPayload()` returns the claims.
 */
const createGoogleIdTokenClient = () => ({
    async verifyIdToken({ idToken, audience }) {
        const payload = await verifySignature(idToken);
        assertClaims(payload, audience);

        return { getPayload: () => payload };
    },
});

const resetKeyCache = () => {
    cachedKeys = null;
};

module.exports = {
    createGoogleIdTokenClient,
    resetKeyCache,
    JWKS_URL,
};
