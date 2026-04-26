const getSecretFromRequest = (req) => {
    const bearerHeader = req.headers.authorization;

    if (bearerHeader?.startsWith('Bearer ')) {
        return bearerHeader.slice('Bearer '.length);
    }

    return req.headers['x-telemetry-secret'] || req.headers['x-app-secret'] || null;
};

const requireAppSecret = (req, res, next) => {
    const configuredSecret = process.env.TELEMETRY_EXPORT_SECRET;

    if (!configuredSecret) {
        return res.status(503).json({ error: 'Telemetry export is not configured' });
    }

    const providedSecret = getSecretFromRequest(req);
    if (!providedSecret || providedSecret !== configuredSecret) {
        return res.status(401).json({ error: 'Invalid telemetry export secret' });
    }

    next();
};

module.exports = {
    requireAppSecret,
};
