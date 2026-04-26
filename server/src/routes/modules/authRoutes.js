const express = require('express');
const authController = require('../../controllers/authController');
const { requireAuth } = require('../../middleware/authMiddleware');
const { createRateLimit } = require('../../middleware/rateLimitMiddleware');
const { rateLimitConfig } = require('../../config/rateLimit');

const router = express.Router();
const publicAuthRateLimit = createRateLimit({
    ...rateLimitConfig.auth,
});

router.post('/register', publicAuthRateLimit, authController.register);
router.post('/login', publicAuthRateLimit, authController.login);
router.post('/forgot-password', publicAuthRateLimit, authController.forgotPassword);
router.post('/reset-password', publicAuthRateLimit, authController.resetPassword);

router.get('/me', requireAuth, authController.getMe);
router.post('/change-password', requireAuth, authController.changePassword);

module.exports = router;
