const MedicService = require('../services/MedicService');
const PatientService = require('../services/PatientService');

const medicService = new MedicService();
const patientService = new PatientService();

const getApiKeyFromRequest = (req) => {
    const bearerHeader = req.headers.authorization;
    if (bearerHeader?.startsWith('Bearer ')) {
        return bearerHeader.slice('Bearer '.length);
    }

    return req.headers['x-api-key'];
};

const resolveMedicFromApiKey = async (req) => {
    const apiKey = getApiKeyFromRequest(req);
    if (!apiKey) {
        const error = new Error('Missing API key');
        error.statusCode = 401;
        throw error;
    }

    const medic = await medicService.getMedicByApiKey(apiKey);
    if (!medic) {
        const error = new Error('Invalid API key');
        error.statusCode = 401;
        throw error;
    }

    return medic;
};

exports.createOrUpdatePatient = async (req, res) => {
    try {
        const medic = await resolveMedicFromApiKey(req);
        const patient = await patientService.upsertExternalPatient(medic.id, req.body);
        const statusCode = req.body?.id ? 200 : 201;
        res.status(statusCode).json(patient);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.updatePatient = async (req, res) => {
    try {
        const medic = await resolveMedicFromApiKey(req);
        const patient = await patientService.upsertExternalPatient(medic.id, {
            ...req.body,
            id: req.params.id,
        });
        res.json(patient);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.deletePatient = async (req, res) => {
    try {
        const medic = await resolveMedicFromApiKey(req);
        await patientService.deleteExternalPatient(medic.id, req.params.id);
        res.status(204).send();
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};
