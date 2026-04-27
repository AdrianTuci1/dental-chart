const express = require('express');
const authRoutes = require('./modules/authRoutes');
const analyticsRoutes = require('./modules/analyticsRoutes');
const clinicRoutes = require('./modules/clinicRoutes');
const medicRoutes = require('./modules/medicRoutes');
const patientRoutes = require('./modules/patientRoutes');
const aiRoutes = require('./modules/aiRoutes');
const externalContractRoutes = require('./modules/externalContractRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/clinics', clinicRoutes);
router.use('/medics', medicRoutes);
router.use('/patients', patientRoutes);
router.use('/ai', aiRoutes);
router.use('/external', externalContractRoutes);

module.exports = router;
