const { asyncHandler } = require('../../../shared/http/asyncHandler');

/** HTTP adapter for patient records and their chart. */
const createPatientController = ({ patientService, analyticsService }) => ({
    createPatient: asyncHandler(async (req, res) => {
        const patientData = req.body || {};
        const newPatient = await patientService.createPatient(patientData);

        if (patientData.medicId) {
            void analyticsService.trackFeatureUsage(patientData.medicId, 'patient_created');
        }

        res.status(201).json(newPatient);
    }),

    getPatient: asyncHandler(async (req, res) => {
        const patient = await patientService.getPatient(req.params.id);

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        return res.json(patient);
    }),

    getPatientChart: asyncHandler(async (req, res) => {
        res.json(await patientService.getPatientFullRecord(req.params.id));
    }),

    deletePatient: asyncHandler(async (req, res) => {
        await patientService.deletePatient(req.params.id);
        res.status(204).send();
    }),

    updatePatient: asyncHandler(async (req, res) => {
        const updatedPatient = await patientService.updatePatient(req.params.id, req.body || {});

        if (updatedPatient.medicId) {
            void analyticsService.trackFeatureUsage(updatedPatient.medicId, 'patient_updated');
        }

        res.json(updatedPatient);
    }),
});

module.exports = createPatientController;
