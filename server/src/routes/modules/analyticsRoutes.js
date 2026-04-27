const express = require('express');
const analyticsController = require('../../controllers/analyticsController');
const { requireAuth } = require('../../middleware/authMiddleware');

const router = express.Router();

router.post('/navigation', analyticsController.trackNavigation);

module.exports = router;
