/**
 * The hardening headers both hosts send, declared once.
 *
 * The Express host applies them through helmet and the Cloudflare Worker sets them by
 * hand, because helmet needs Node. Keeping the values here is what stops the two from
 * drifting: a header changed for one host changes for the other in the same commit, and
 * a deployment can compare the two answers instead of trusting that they match.
 *
 * The directive list is the complete set, including the ones helmet adds by default
 * (base-uri, form-action, frame-ancestors, object-src, script-src-attr,
 * upgrade-insecure-requests). helmet runs with `useDefaults: false` against this list, so
 * what it sends is exactly what is written here.
 */
const CSP_DIRECTIVES = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'font-src': ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'object-src': ["'none'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    'script-src-attr': ["'none'"],
    'style-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    // No value: the directive either applies or it does not.
    'upgrade-insecure-requests': [],
    // The retired API origin and the Pages hosts stay allowed until both are gone; the
    // app answers its own API on its own origin, so nothing here is required for it.
    'connect-src': ["'self'", 'https://api.pixtooth.com', 'https://*.pages.dev', 'https://cdn.jsdelivr.net'],
};

/** Renders the directive map the way helmet does: `;` between directives, no spaces. */
const contentSecurityPolicy = () => Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => (values.length ? `${directive} ${values.join(' ')}` : directive))
    .join(';');

const SECURITY_HEADERS = {
    'Content-Security-Policy': contentSecurityPolicy(),
    'Cross-Origin-Opener-Policy': 'same-origin',
    // The API answers images and JSON that other origins embed, so the default
    // same-origin policy would break the AI sample images on the Pages host.
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Origin-Agent-Cluster': '?1',
    'Referrer-Policy': 'no-referrer',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-XSS-Protection': '0',
};

module.exports = { CSP_DIRECTIVES, SECURITY_HEADERS };
