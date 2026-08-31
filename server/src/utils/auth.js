const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-jwt-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

/**
 * Access tokens stay stateless on purpose: every replica can verify one with the shared
 * JWT_SECRET, so nothing has to be replicated. Refresh tokens are opaque and therefore
 * live in DynamoDB (see SessionService).
 */
const signAuthToken = (medic) => jwt.sign(
    {
        sub: medic.id,
        email: medic.email,
        type: 'auth',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
);

const verifyAuthToken = (token) => jwt.verify(token, JWT_SECRET);

const extractMedicIdFromAuthHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    try {
        const payload = verifyAuthToken(authHeader.split(' ')[1]);
        return payload.sub || null;
    } catch {
        return null;
    }
};

const extractMedicIdFromRequest = (req) => req?.auth?.userId || extractMedicIdFromAuthHeader(req?.headers?.authorization);

// Parses durations like '90d', '15m', '12h' into milliseconds; 0 when unparseable.
function parseDurationMs(value) {
    const match = String(value || '').trim().match(/^(\d+(?:\.\d+)?)\s*(s|m|h|d|w|y)$/i);
    if (!match) {
        return 0;
    }

    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000, y: 31536000000 };
    return parseFloat(match[1]) * units[match[2].toLowerCase()];
}

module.exports = {
    signAuthToken,
    verifyAuthToken,
    extractMedicIdFromAuthHeader,
    extractMedicIdFromRequest,
    parseDurationMs,
};
