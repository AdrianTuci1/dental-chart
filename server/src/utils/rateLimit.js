const { verifyAuthToken } = require('./auth');
const { hashApiKey } = require('./apiKeys');

const parsePositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getRequestIp = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

const resolveApiRateLimitKey = (req) => {
    if (req.path.startsWith('/auth/')) {
        return getRequestIp(req);
    }

    const authorization = req.headers.authorization;
    const rawApiKey = req.headers['x-api-key'];

    if (authorization?.startsWith('ApiKey ')) {
        return `api-key:${hashApiKey(authorization.slice('ApiKey '.length))}`;
    }

    if (authorization?.startsWith('Bearer ')) {
        const bearerToken = authorization.slice('Bearer '.length);

        try {
            const payload = verifyAuthToken(bearerToken);
            if (payload?.sub) {
                return `account:${payload.sub}`;
            }
        } catch {
            return `api-key:${hashApiKey(bearerToken)}`;
        }
    }

    if (rawApiKey) {
        return `api-key:${hashApiKey(rawApiKey)}`;
    }

    return getRequestIp(req);
};

module.exports = {
    parsePositiveInt,
    resolveApiRateLimitKey,
};
