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
    'font-src': ["'self'", 'data:', 'https://cdn.jsdelivr.net', 'https://fonts.gstatic.com'],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    // Google Identity Services renders "Continue with Google" in its own iframe and calls
    // back to accounts.google.com, so the button needs frame-src and connect-src too.
    'frame-src': ["'self'", 'https://accounts.google.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'object-src': ["'none'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://accounts.google.com'],
    'script-src-attr': ["'none'"],
    // accounts.google.com serves the Google Identity Services button, fonts.googleapis.com
    // the Inter stylesheet index.html links; both were blocked until this list existed.
    'style-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://accounts.google.com', 'https://fonts.googleapis.com'],
    // No value: the directive either applies or it does not.
    'upgrade-insecure-requests': [],
    // The app answers its own API on its own origin, so only the Pages hosts stay allowed
    // here, left over from the frontend that used to live there.
    'connect-src': ["'self'", 'https://*.pages.dev', 'https://cdn.jsdelivr.net', 'https://accounts.google.com'],
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
