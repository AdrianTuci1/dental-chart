const express = require('express');
const router = express.Router();

const clinicController = require('../controllers/clinicController');
const medicController = require('../controllers/medicController');
const patientController = require('../controllers/patientController');
const historyController = require('../controllers/historyController');
const treatmentPlanController = require('../controllers/treatmentPlanController');
// Clinic Routes
router.post('/clinics', clinicController.createClinic);
router.get('/clinics/:id', clinicController.getClinic);

// Medic Routes
router.post('/medics', medicController.createMedic);
router.get('/medics/:id', medicController.getMedic);
router.get('/medics/:id/patients', medicController.getMedicPatients);

// Patient Routes
router.post('/patients', patientController.createPatient);
router.get('/patients/:id', patientController.getPatient);
router.get('/patients/:id/chart', patientController.getPatientChart);
router.post('/patients/:patientId/history', historyController.addHistoryRecord);
router.get('/patients/:patientId/history', historyController.getPatientHistory);

// Treatment Plan Routes
router.post('/patients/:patientId/treatment-plans', treatmentPlanController.addTreatmentPlanItem);
router.get('/patients/:patientId/treatment-plans', treatmentPlanController.getPatientTreatmentPlans);

module.exports = router;
