const { asyncHandler } = require('../../../shared/http/asyncHandler');
const { BadRequestError } = require('../../../shared/errors/AppError');
const { authTokenService } = require('../../identity/application/AuthTokenService');

/**
 * Telemetry endpoints. A signed-in medic's id wins over the body value, so a client
 * cannot write into another account's profile.
 */
const createAnalyticsController = ({
    analyticsService,
    tokenService = authTokenService,
}) => ({
    trackNavigation: asyncHandler(async (req, res) => {
        const body = req.body || {};
        const userId = tokenService.medicIdFromRequest(req) || body.userId;

        if (!userId) {
            throw new BadRequestError('User ID is required');
        }

        if (body.menuName) {
            await analyticsService.trackNavigation(userId, body.menuName);
        }

        if (body.onboardingStep) {
            await analyticsService.trackOnboarding(userId, body.onboardingStep);
        }

        if (body.heartbeat) {
            await analyticsService.trackHeartbeat(userId, body.heartbeat.minutes || 1);
        }

        if (body.metadata) {
            await analyticsService.trackMetadata(userId, body.metadata);
        }

        res.status(200).json({ success: true });
    }),
});

module.exports = createAnalyticsController;
