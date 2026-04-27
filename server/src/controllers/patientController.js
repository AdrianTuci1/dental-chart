const PatientService = require('../services/PatientService');
const UserAnalyticsService = require('../services/UserAnalyticsService');

const patientService = new PatientService();
const analyticsService = new UserAnalyticsService();

exports.createPatient = async (req, res) => {
    try {
        const patientData = req.body;
        const newPatient = await patientService.createPatient(patientData);
        
        // Track feature usage in user profile
        if (patientData.medicId) {
            void analyticsService.trackFeatureUsage(patientData.medicId, 'patient_created');
        }
        
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
        await patientService.deletePatient(id);
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

        // Track feature usage
        if (updatedPatient.medicId) {
            void analyticsService.trackFeatureUsage(updatedPatient.medicId, 'patient_updated');
        }

        res.json(updatedPatient);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};
