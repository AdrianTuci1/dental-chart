const buckets = new Map();

const getClientIp = (req) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
        return forwardedFor.split(',')[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || 'unknown';
};

const createRateLimit = ({
    windowMs,
    max,
    keyPrefix = 'global',
    message = 'Too many requests',
    keyResolver = null,
}) => {
    if (!windowMs || !max) {
        throw new Error('windowMs and max are required for rate limiting');
    }

    return (req, res, next) => {
        const now = Date.now();
        const resolvedKey = keyResolver ? keyResolver(req) : getClientIp(req);
        const key = `${keyPrefix}:${resolvedKey || 'unknown'}`;
        const bucket = buckets.get(key);

        if (!bucket || now >= bucket.resetAt) {
            buckets.set(key, {
                count: 1,
                resetAt: now + windowMs,
            });
            return next();
        }

        if (bucket.count >= max) {
            const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
            res.setHeader('Retry-After', String(retryAfterSeconds));
            return res.status(429).json({ error: message });
        }

        bucket.count += 1;
        buckets.set(key, bucket);
        next();
    };
};

module.exports = {
    createRateLimit,
};
