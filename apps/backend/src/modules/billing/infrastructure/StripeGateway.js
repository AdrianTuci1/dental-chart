const Stripe = require('stripe');

/**
 * Thin adapter over the Stripe SDK. The billing service never sees the SDK, so tests
 * can replace this object and the application layer stays provider-agnostic.
 */
class StripeGateway {
    constructor({
        secretKey,
        webhookSecret,
        priceIds = {},
        successUrl,
        cancelUrl,
        portalReturnUrl,
        client = null,
    }) {
        this.webhookSecret = webhookSecret;
        this.priceIds = priceIds;
        this.successUrl = successUrl;
        this.cancelUrl = cancelUrl;
        this.portalReturnUrl = portalReturnUrl;
        this.client = client || new Stripe(secretKey);
    }

    async createCustomer({ email, name, medicId }) {
        return this.client.customers.create({
            email,
            name,
            metadata: { medicId: String(medicId) },
        });
    }

    async createCheckoutSession({ customerId, priceId, medicId }) {
        return this.client.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            allow_promotion_codes: true,
            client_reference_id: String(medicId),
            metadata: { medicId: String(medicId) },
            subscription_data: {
                metadata: { medicId: String(medicId) },
            },
            success_url: this.successUrl,
            cancel_url: this.cancelUrl,
        });
    }

    async createPortalSession({ customerId }) {
        return this.client.billingPortal.sessions.create({
            customer: customerId,
            return_url: this.portalReturnUrl,
        });
    }

    async retrieveSubscription(subscriptionId) {
        return this.client.subscriptions.retrieve(subscriptionId);
    }

    constructEvent(rawBody, signature) {
        return this.client.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    }

    intervalForPrice(priceId) {
        if (priceId === this.priceIds.month) return 'month';
        if (priceId === this.priceIds.year) return 'year';
        return null;
    }
}

const createStripeGateway = (billingConfig) => {
    if (!billingConfig?.enabled) {
        return null;
    }

    return new StripeGateway({
        secretKey: billingConfig.secretKey,
        webhookSecret: billingConfig.webhookSecret,
        priceIds: billingConfig.priceIds,
        successUrl: billingConfig.successUrl,
        cancelUrl: billingConfig.cancelUrl,
        portalReturnUrl: billingConfig.portalReturnUrl,
    });
};

module.exports = { StripeGateway, createStripeGateway };
