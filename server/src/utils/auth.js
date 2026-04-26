const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-jwt-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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

module.exports = {
    signAuthToken,
    verifyAuthToken,
    extractMedicIdFromAuthHeader,
    extractMedicIdFromRequest,
};
