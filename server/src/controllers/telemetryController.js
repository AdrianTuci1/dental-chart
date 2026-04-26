const TelemetryService = require('../services/TelemetryService');
const ClinicService = require('../services/ClinicService');
const { extractMedicIdFromRequest } = require('../utils/auth');

const telemetryService = new TelemetryService();
const clinicService = new ClinicService();

exports.ingestEvent = async (req, res) => {
    try {
        const userId = extractMedicIdFromRequest(req) || req.body.userId || null;
        let clinicId = req.body.clinicId || null;

        if (!clinicId && userId) {
            try {
                const clinic = await clinicService.resolveClinicForMedic(userId);
                clinicId = clinic?.id || null;
            } catch {
                clinicId = null;
            }
        }

        const event = await telemetryService.trackEvent({
            ...req.body,
            userId,
            clinicId,
            source: req.body.source || 'client',
        });

        res.status(201).json(event);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};
