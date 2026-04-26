const express = require('express');
const telemetryController = require('../../controllers/telemetryController');
const { requireAuth } = require('../../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.post('/events', telemetryController.ingestEvent);

module.exports = router;
