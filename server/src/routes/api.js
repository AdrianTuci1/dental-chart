const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const clinicController = require('../controllers/clinicController');
const medicController = require('../controllers/medicController');
const patientController = require('../controllers/patientController');
const historyController = require('../controllers/historyController');
const treatmentPlanController = require('../controllers/treatmentPlanController');
const aiController = require('../controllers/aiController');
const apiContractController = require('../controllers/apiContractController');
const telemetryController = require('../controllers/telemetryController');

// Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authController.getMe);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.post('/auth/change-password', authController.changePassword);

// Telemetry Routes
router.post('/telemetry/events', telemetryController.ingestEvent);
router.get('/telemetry/events', telemetryController.listEvents);

// Clinic Routes
router.post('/clinics', clinicController.createClinic);
router.get('/clinics/:id', clinicController.getClinic);
router.get('/clinics/:id/members', clinicController.getClinicMembers);
router.post('/clinics/:id/invitations', clinicController.inviteMedic);
router.post('/clinics/:id/invitations/:inviteId/accept', clinicController.acceptInvitation);
router.post('/clinics/:id/ownership-transfer', clinicController.transferOwnership);

// Medic Routes
router.post('/medics', medicController.createMedic);
router.get('/medics/:id', medicController.getMedic);
router.get('/medics/:id/patients', medicController.getMedicPatients);
router.get('/medics/:id/clinics', clinicController.listMedicClinics);
router.post('/medics/:id/seed', medicController.seedMedicData);
router.post('/medics/:id/api-key/rotate', medicController.rotateApiKey);
router.delete('/medics/:id', medicController.deleteMedic);

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

// AI Routes
const expressRaw = express.raw({ type: 'application/octet-stream', limit: '10mb' });
router.post('/ai/analyze', expressRaw, aiController.analyzeXray);
router.get(/^\/ai\/assets\/(.+)$/, aiController.serveAsset);

// External Contract Routes
router.post('/external/patients', apiContractController.createOrUpdatePatient);
router.put('/external/patients/:id', apiContractController.updatePatient);
router.delete('/external/patients/:id', apiContractController.deletePatient);

module.exports = router;
