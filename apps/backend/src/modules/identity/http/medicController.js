const { asyncHandler } = require('../../../shared/http/asyncHandler');

/** HTTP adapter for the account endpoints. */
const createMedicController = ({ medicService, patientSeedService }) => ({
    createMedic: asyncHandler(async (req, res) => {
        res.status(201).json(await medicService.createMedic(req.body));
    }),

    getMedic: asyncHandler(async (req, res) => {
        const medic = await medicService.getMedicProfile(req.params.id);
        if (!medic) {
            return res.status(404).json({ error: 'Medic not found' });
        }

        return res.json(medic);
    }),

    getMedicPatients: asyncHandler(async (req, res) => {
        const patients = await medicService.getMedicPatients(req.params.id, req.query.clinicId || null);
        res.json(patients);
    }),

    updateMedic: asyncHandler(async (req, res) => {
        res.json(await medicService.updateMedicProfile(req.params.id, req.body));
    }),

    seedMedicData: asyncHandler(async (req, res) => {
        await patientSeedService.seedForMedic(req.params.id);
        res.json({ message: 'Success: Seeded/Updated mock data for medic' });
    }),

    deleteMedic: asyncHandler(async (req, res) => {
        const transferOwnershipTo = req.body?.transferOwnershipTo || req.query.transferOwnershipTo || null;
        res.json(await medicService.deleteMedicAndPatients(req.params.id, transferOwnershipTo));
    }),

    rotateApiKey: asyncHandler(async (req, res) => {
        res.json(await medicService.rotateApiKey(req.params.id));
    }),
});

module.exports = createMedicController;
