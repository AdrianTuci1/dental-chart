const PatientService = require('../services/PatientService');

const patientService = new PatientService();

exports.createPatient = async (req, res) => {
    try {
        const patientData = req.body;
        const newPatient = await patientService.createPatient(patientData);
        res.status(201).json(newPatient);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
};

exports.getPatientChart = async (req, res) => {
    try {
        const { id } = req.params;
        // The service now fetches patient, chart (plans), and history from DynamoDB
        const fullRecord = await patientService.getPatientFullRecord(id);
        res.json(fullRecord);
    } catch (err) {
        if (err.message === 'Patient not found') {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        await patientService.deletePatient(id);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patientData = req.body;
        const updatedPatient = await patientService.updatePatient(id, patientData);
        res.json(updatedPatient);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
