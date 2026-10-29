const { asyncHandler } = require('../../../shared/http/asyncHandler');

/** HTTP adapter for the completed-history entries of a patient chart. */
const createHistoryController = ({ historyService }) => ({
    addHistoryRecord: asyncHandler(async (req, res) => {
        res.status(201).json(await historyService.addHistoryRecord(req.params.patientId, req.body || {}));
    }),

    getPatientHistory: asyncHandler(async (req, res) => {
        res.json(await historyService.getPatientHistory(req.params.patientId));
    }),
});

module.exports = createHistoryController;
