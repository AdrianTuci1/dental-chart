const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-jwt-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev-only-insecure-refresh-secret';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// In-memory refresh token store (replace with Redis/DB in production)
const refreshTokens = new Map();

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

const generateRefreshToken = (medicId) => {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + ms(REFRESH_TOKEN_EXPIRES_IN));
    refreshTokens.set(token, { medicId, expiresAt });
    return token;
};

const verifyRefreshToken = (token) => {
    const stored = refreshTokens.get(token);
    if (!stored) return null;
    if (new Date() > stored.expiresAt) {
        refreshTokens.delete(token);
        return null;
    }
    return stored.medicId;
};

const revokeRefreshToken = (token) => {
    refreshTokens.delete(token);
};

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

// Helper to parse time strings like '7d', '15m' to ms
function ms(str) {
    const match = str.match(/^(\d+(?:\.\d+)?)\s*(s|m|h|d|w|y)$/i);
    if (!match) return 0;
    const n = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000, y: 31536000000 };
    return n * (units[unit] || 0);
}

module.exports = {
    signAuthToken,
    verifyAuthToken,
    generateRefreshToken,
    verifyRefreshToken,
    revokeRefreshToken,
    extractMedicIdFromAuthHeader,
    extractMedicIdFromRequest,
};
