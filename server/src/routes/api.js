const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const clinicController = require('../controllers/clinicController');
const medicController = require('../controllers/medicController');
const patientController = require('../controllers/patientController');
const scanController = require('../controllers/scanController');

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

// Scan Routes
router.post('/scans/upload', upload.single('file'), scanController.uploadScan);
router.post('/scans/webhook', scanController.updateScanStatus);

module.exports = router;
