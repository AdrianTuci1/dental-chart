const PatientService = require('../services/PatientService');
const TelemetryService = require('../services/TelemetryService');
const { extractMedicIdFromAuthHeader } = require('../utils/auth');

const patientService = new PatientService();
const telemetryService = new TelemetryService();

exports.createPatient = async (req, res) => {
    try {
        const patientData = req.body;
        const newPatient = await patientService.createPatient(patientData);
        await telemetryService.trackEvent({
            eventName: 'patient_created',
            category: 'patient',
            userId: extractMedicIdFromAuthHeader(req.headers.authorization) || patientData.medicId,
            clinicId: newPatient.clinicId || null,
            entityType: 'patient',
            entityId: newPatient.id,
            metadata: {
                ownerMedicId: newPatient.ownerMedicId || null,
            },
        });
        res.status(201).json(newPatient);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.getPatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await patientService.getPatient(id);

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        res.json(patient);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.getPatientChart = async (req, res) => {
    try {
        const { id } = req.params;
        // The service now fetches patient, chart (plans), and history from DynamoDB
        const fullRecord = await patientService.getPatientFullRecord(id);
        res.json(fullRecord);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const existingPatient = await patientService.getPatient(id);
        await patientService.deletePatient(id);
        await telemetryService.trackEvent({
            eventName: 'patient_deleted',
            category: 'patient',
            userId: extractMedicIdFromAuthHeader(req.headers.authorization) || existingPatient?.medicId || null,
            clinicId: existingPatient?.clinicId || null,
            entityType: 'patient',
            entityId: id,
        });
        res.status(204).send();
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patientData = req.body;
        const updatedPatient = await patientService.updatePatient(id, patientData);
        await telemetryService.trackEvent({
            eventName: 'patient_updated',
            category: 'patient',
            userId: extractMedicIdFromAuthHeader(req.headers.authorization) || updatedPatient.medicId || null,
            clinicId: updatedPatient.clinicId || null,
            entityType: 'patient',
            entityId: id,
        });
        res.json(updatedPatient);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};
