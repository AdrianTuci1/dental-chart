const { asyncHandler } = require('../../../shared/http/asyncHandler');

/** HTTP adapter for checkout, the customer portal and Stripe webhooks. */
const createBillingController = ({ billingService }) => ({
    getStatus: asyncHandler(async (req, res) => {
        res.json(await billingService.getStatus(req.auth.userId));
    }),

    createCheckout: asyncHandler(async (req, res) => {
        res.json(await billingService.createCheckout(req.auth.userId, req.body?.interval));
    }),

    createPortal: asyncHandler(async (req, res) => {
        res.json(await billingService.createPortal(req.auth.userId));
    }),

    webhook: asyncHandler(async (req, res) => {
        const signature = req.headers['stripe-signature'];

        res.json(await billingService.handleWebhook({
            rawBody: req.rawBody,
            signature,
        }));
    }),
});

module.exports = createBillingController;
