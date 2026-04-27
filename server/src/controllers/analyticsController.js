const UserAnalyticsService = require('../services/UserAnalyticsService');
const { extractMedicIdFromRequest } = require('../utils/auth');

const analyticsService = new UserAnalyticsService();

/**
 * Tracks user navigation and UI milestones without creating individual logs.
 * Updates the user's analytics profile.
 */
exports.trackNavigation = async (req, res) => {
    try {
        const userId = extractMedicIdFromRequest(req) || req.body.userId;
        const { menuName, onboardingStep, heartbeat, metadata } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (menuName) {
            await analyticsService.trackNavigation(userId, menuName);
        }

        if (onboardingStep) {
            await analyticsService.trackOnboarding(userId, onboardingStep);
        }

        if (heartbeat) {
            await analyticsService.trackHeartbeat(userId, heartbeat.minutes || 1);
        }

        if (metadata) {
            await analyticsService.trackMetadata(userId, metadata);
        }

        res.status(200).json({ success: true });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

// Deprecated or kept for legacy if needed, but we prefer trackNavigation for single-log approach
exports.ingestEvent = async (req, res) => {
    // For now, redirect specific events to analytics or just return success
    res.status(200).json({ message: 'Event received (Legacy)' });
};
