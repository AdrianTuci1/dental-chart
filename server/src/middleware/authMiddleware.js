const { verifyAuthToken } = require('../utils/auth');

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const payload = verifyAuthToken(token);
        req.auth = {
            token,
            userId: payload.sub,
            email: payload.email,
            payload,
        };
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const optionalAuth = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    try {
        const token = authHeader.split(' ')[1];
        const payload = verifyAuthToken(token);
        req.auth = {
            token,
            userId: payload.sub,
            email: payload.email,
            payload,
        };
    } catch {
        req.auth = null;
    }

    next();
};

const requireSameMedicParam = (paramName = 'id') => (req, res, next) => {
    const authenticatedMedicId = req?.auth?.userId;
    const targetMedicId = req?.params?.[paramName];

    if (!authenticatedMedicId) {
        return res.status(401).json({ error: 'Unauthorized: No authenticated user' });
    }

    if (!targetMedicId || String(authenticatedMedicId) !== String(targetMedicId)) {
        return res.status(403).json({ error: 'Forbidden: You can only access your own medic resources' });
    }

    next();
};

module.exports = {
    requireAuth,
    optionalAuth,
    requireSameMedicParam,
};
