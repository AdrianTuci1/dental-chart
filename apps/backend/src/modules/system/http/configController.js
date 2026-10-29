const { asyncHandler } = require('../../../shared/http/asyncHandler');

const createConfigController = ({ configurationService }) => ({
    getConfig: asyncHandler(async (req, res) => {
        res.json(configurationService.describe());
    }),

    sendTestEmail: asyncHandler(async (req, res) => {
        const result = await configurationService.sendTestEmail(req.auth.userId);

        // A missing or failing email provider is a configuration state, not a broken
        // request: answer 200 so the settings screen can show the provider's reason.
        res.json(result);
    }),
});

module.exports = createConfigController;
