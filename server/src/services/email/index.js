const cloudflare = require('./transports/cloudflare');
const gmail = require('./transports/gmail');
const resend = require('./transports/resend');

const TRANSPORTS = { resend, cloudflare, gmail };

// Gmail is the legacy transport, so a key for one of the newer providers wins
// when EMAIL_PROVIDER is left unset.
const AUTO_DETECT_ORDER = ['resend', 'cloudflare', 'gmail'];

const describeAll = (env) => AUTO_DETECT_ORDER
    .map((name) => `${name}(${TRANSPORTS[name].requiredEnv.join(', ')})`)
    .join(' | ');

/**
 * Picks the email transport from a single variable: EMAIL_PROVIDER. Without it,
 * the first fully configured transport is used, so existing deployments keep working.
 */
const selectTransport = (env = process.env) => {
    const requested = (env.EMAIL_PROVIDER || '').trim().toLowerCase();

    if (requested) {
        const transport = TRANSPORTS[requested];

        if (!transport) {
            return {
                transport: null,
                reason: 'unknown_provider',
                detail: `EMAIL_PROVIDER="${requested}" is not supported, use one of: ${Object.keys(TRANSPORTS).join(', ')}`,
            };
        }

        const missing = transport.missingConfig(env);
        if (missing.length) {
            return {
                transport: null,
                reason: 'missing_credentials',
                detail: `EMAIL_PROVIDER="${requested}" needs ${missing.join(', ')}`,
            };
        }

        return { transport, reason: null, detail: null };
    }

    for (const name of AUTO_DETECT_ORDER) {
        const transport = TRANSPORTS[name];

        if (!transport.missingConfig(env).length) {
            return { transport, reason: null, detail: null, autoDetected: true };
        }
    }

    return {
        transport: null,
        reason: 'not_configured',
        detail: `no email provider configured; set EMAIL_PROVIDER and its variables: ${describeAll(env)}`,
    };
};

module.exports = { TRANSPORTS, selectTransport };
