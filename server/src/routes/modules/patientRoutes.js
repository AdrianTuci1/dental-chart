const express = require('express');
const patientController = require('../../controllers/patientController');
const historyController = require('../../controllers/historyController');
const treatmentPlanController = require('../../controllers/treatmentPlanController');
const { requireAuth } = require('../../middleware/authMiddleware');
const { createTelemetryMiddleware } = require('../../middleware/telemetryMiddleware');
const { attachPatientContext } = require('../../middleware/patientContextMiddleware');
const {
    buildPatientCreatedEvent,
    buildPatientUpdatedEvent,
    buildPatientDeletedEvent,
    buildHistoryRecordAddedEvent,
    buildTreatmentPlanItemAddedEvent,
} = require('../../telemetry/builders');

const router = express.Router();

router.use(requireAuth);

router.post('/', createTelemetryMiddleware(buildPatientCreatedEvent), patientController.createPatient);
router.get('/:id', patientController.getPatient);
router.get('/:id/chart', patientController.getPatientChart);
router.delete('/:id', attachPatientContext, createTelemetryMiddleware(buildPatientDeletedEvent), patientController.deletePatient);
router.put('/:id', createTelemetryMiddleware(buildPatientUpdatedEvent), patientController.updatePatient);
router.post('/:patientId/history', attachPatientContext, createTelemetryMiddleware(buildHistoryRecordAddedEvent), historyController.addHistoryRecord);
router.get('/:patientId/history', historyController.getPatientHistory);
router.post('/:patientId/treatment-plans', attachPatientContext, createTelemetryMiddleware(buildTreatmentPlanItemAddedEvent), treatmentPlanController.addTreatmentPlanItem);
router.get('/:patientId/treatment-plans', treatmentPlanController.getPatientTreatmentPlans);

module.exports = router;
