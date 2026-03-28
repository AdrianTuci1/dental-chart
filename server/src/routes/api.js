const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const clinicController = require('../controllers/clinicController');
const medicController = require('../controllers/medicController');
const patientController = require('../controllers/patientController');
const historyController = require('../controllers/historyController');
const treatmentPlanController = require('../controllers/treatmentPlanController');

// Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authController.getMe);

// Clinic Routes
router.post('/clinics', clinicController.createClinic);
router.get('/clinics/:id', clinicController.getClinic);

// Medic Routes
router.post('/medics', medicController.createMedic);
router.get('/medics/:id', medicController.getMedic);
router.get('/medics/:id/patients', medicController.getMedicPatients);
router.post('/medics/:id/seed', medicController.seedMedicData);

// Patient Routes
router.post('/patients', patientController.createPatient);
router.get('/patients/:id', patientController.getPatient);
router.get('/patients/:id/chart', patientController.getPatientChart);
router.delete('/patients/:id', patientController.deletePatient);
router.put('/patients/:id', patientController.updatePatient);
router.post('/patients/:patientId/history', historyController.addHistoryRecord);
router.get('/patients/:patientId/history', historyController.getPatientHistory);

// Treatment Plan Routes
router.post('/patients/:patientId/treatment-plans', treatmentPlanController.addTreatmentPlanItem);
router.get('/patients/:patientId/treatment-plans', treatmentPlanController.getPatientTreatmentPlans);

module.exports = router;

