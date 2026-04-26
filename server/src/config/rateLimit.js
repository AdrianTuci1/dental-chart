const { parsePositiveInt } = require('../utils/rateLimit');

const rateLimitConfig = {
    api: {
        windowMs: parsePositiveInt(process.env.API_RATE_LIMIT_WINDOW_MS, 60 * 1000),
        max: parsePositiveInt(process.env.API_RATE_LIMIT_PER_WINDOW, 500),
        keyPrefix: 'api-global',
        message: 'Too many API requests. Please try again in a minute.',
    },
    auth: {
        windowMs: parsePositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60 * 1000),
        max: parsePositiveInt(process.env.AUTH_RATE_LIMIT_PER_WINDOW, 60),
        keyPrefix: 'auth-public',
        message: 'Too many authentication attempts. Please try again in a minute.',
    },
};

module.exports = {
    rateLimitConfig,
};
