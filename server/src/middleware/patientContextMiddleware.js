const PatientService = require('../services/PatientService');

const patientService = new PatientService();

const attachPatientContext = async (req, _res, next) => {
    const patientId = req.params.id || req.params.patientId;

    if (!patientId) {
        return next();
    }

    try {
        const patient = await patientService.getPatient(patientId);
        req.patientContext = patient || null;
    } catch {
        req.patientContext = null;
    }

    next();
};

module.exports = {
    attachPatientContext,
};
