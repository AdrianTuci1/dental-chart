const express = require('express');
const patientController = require('../../controllers/patientController');
const historyController = require('../../controllers/historyController');
const treatmentPlanController = require('../../controllers/treatmentPlanController');
const { requireAuth } = require('../../middleware/authMiddleware');
const { attachPatientContext } = require('../../middleware/patientContextMiddleware');
const router = express.Router();

router.use(requireAuth);

router.post('/', patientController.createPatient);
router.get('/:id', patientController.getPatient);
router.get('/:id/chart', patientController.getPatientChart);
router.delete('/:id', attachPatientContext, patientController.deletePatient);
router.put('/:id', patientController.updatePatient);
router.post('/:patientId/history', attachPatientContext, historyController.addHistoryRecord);
router.get('/:patientId/history', historyController.getPatientHistory);
router.post('/:patientId/treatment-plans', attachPatientContext, treatmentPlanController.addTreatmentPlanItem);
router.get('/:patientId/treatment-plans', treatmentPlanController.getPatientTreatmentPlans);

module.exports = router;
