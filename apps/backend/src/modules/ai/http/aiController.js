const { asyncHandler } = require('../../../shared/http/asyncHandler');
const { authTokenService } = require('../../identity/application/AuthTokenService');

/** HTTP adapter for x-ray analysis and the sample assets the module serves. */
const createAIController = ({
    aiService,
    analyticsService,
    tokenService = authTokenService,
}) => ({
    analyzeXray: asyncHandler(async (req, res) => {
        const { payload, usedFallback } = await aiService.analyzeWithFallback(req.body);

        if (!usedFallback) {
            const userId = tokenService.medicIdFromRequest(req);
            if (userId) {
                void analyticsService.trackFeatureUsage(userId, 'ai_analysis');
            }
        }

        res.json(payload);
    }),

    serveAsset: asyncHandler(async (req, res) => {
        const asset = await aiService.getAsset(req.params[0]);
        res.setHeader('Content-Type', asset.contentType);
        res.send(asset.body);
    }),
});

module.exports = createAIController;
