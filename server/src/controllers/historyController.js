const HistoryService = require('../services/HistoryService');
const PatientService = require('../services/PatientService');
const TelemetryService = require('../services/TelemetryService');
const { extractMedicIdFromAuthHeader } = require('../utils/auth');

const historyService = new HistoryService();
const patientService = new PatientService();
const telemetryService = new TelemetryService();

exports.addHistoryRecord = async (req, res) => {
    try {
        const { patientId } = req.params;
        const historyData = req.body;

        const newRecord = await historyService.addHistoryRecord(patientId, historyData);
        const patient = await patientService.getPatient(patientId);
        await telemetryService.trackEvent({
            eventName: 'history_record_added',
            category: 'treatment',
            userId: extractMedicIdFromAuthHeader(req.headers.authorization) || patient?.medicId || null,
            clinicId: patient?.clinicId || null,
            entityType: 'patient',
            entityId: patientId,
            metadata: {
                treatmentType: historyData.type || null,
                procedure: historyData.procedure || null,
            },
        });
        res.status(201).json(newRecord);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPatientHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const history = await historyService.getPatientHistory(patientId);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
