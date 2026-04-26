const TelemetryService = require('../services/TelemetryService');
const { extractMedicIdFromRequest } = require('../utils/auth');

const telemetryService = new TelemetryService();

const createTelemetryMiddleware = (buildEvent) => async (req, res, next) => {
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    let tracked = false;

    const emitEvent = async (responseBody) => {
        if (tracked || res.statusCode >= 400 || typeof buildEvent !== 'function') {
            return;
        }

        tracked = true;

        try {
            const eventPayload = await buildEvent({
                req,
                res,
                responseBody,
                userId: extractMedicIdFromRequest(req),
            });

            if (eventPayload) {
                await telemetryService.trackEvent(eventPayload);
            }
        } catch (error) {
            console.error('[TelemetryMiddleware] Failed to track event', error);
        }
    };

    res.json = (body) => {
        void emitEvent(body);
        return originalJson(body);
    };

    res.send = (body) => {
        void emitEvent(body);
        return originalSend(body);
    };

    next();
};

module.exports = {
    createTelemetryMiddleware,
};
