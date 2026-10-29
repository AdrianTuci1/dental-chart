const { asyncHandler } = require('../../../shared/http/asyncHandler');

/** HTTP adapter for the planned treatments of a patient chart. */
const createTreatmentPlanController = ({ treatmentPlanService }) => ({
    addTreatmentPlanItem: asyncHandler(async (req, res) => {
        res.status(201).json(await treatmentPlanService.addTreatmentPlanItem(req.params.patientId, req.body || {}));
    }),

    getPatientTreatmentPlans: asyncHandler(async (req, res) => {
        res.json(await treatmentPlanService.getPatientTreatmentPlans(req.params.patientId));
    }),
});

module.exports = createTreatmentPlanController;
