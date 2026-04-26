const express = require('express');
const authRoutes = require('./modules/authRoutes');
const telemetryRoutes = require('./modules/telemetryRoutes');
const clinicRoutes = require('./modules/clinicRoutes');
const medicRoutes = require('./modules/medicRoutes');
const patientRoutes = require('./modules/patientRoutes');
const aiRoutes = require('./modules/aiRoutes');
const externalContractRoutes = require('./modules/externalContractRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/telemetry', telemetryRoutes);
router.use('/clinics', clinicRoutes);
router.use('/medics', medicRoutes);
router.use('/patients', patientRoutes);
router.use('/ai', aiRoutes);
router.use('/external', externalContractRoutes);

module.exports = router;
