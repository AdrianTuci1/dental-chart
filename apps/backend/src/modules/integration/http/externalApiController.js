const { asyncHandler } = require('../../../shared/http/asyncHandler');

/** HTTP adapter for the external (API-key) patient contract. */
const createExternalApiController = ({ apiKeyAuthenticator, patientService }) => ({
    createOrUpdatePatient: asyncHandler(async (req, res) => {
        const medic = await apiKeyAuthenticator.authenticate(req);
        const patient = await patientService.upsertExternalPatient(medic.id, req.body || {});

        res.status(req.body?.id ? 200 : 201).json(patient);
    }),

    updatePatient: asyncHandler(async (req, res) => {
        const medic = await apiKeyAuthenticator.authenticate(req);
        const patient = await patientService.upsertExternalPatient(medic.id, {
            ...(req.body || {}),
            id: req.params.id,
        });

        res.json(patient);
    }),

    deletePatient: asyncHandler(async (req, res) => {
        const medic = await apiKeyAuthenticator.authenticate(req);
        await patientService.deleteExternalPatient(medic.id, req.params.id);
        res.status(204).send();
    }),
});

module.exports = createExternalApiController;
