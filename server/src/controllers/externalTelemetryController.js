const TelemetryService = require('../services/TelemetryService');

const telemetryService = new TelemetryService();

exports.listProductEvents = async (req, res) => {
    try {
        const events = await telemetryService.listProductEvents(req.query);
        res.json(events);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};
