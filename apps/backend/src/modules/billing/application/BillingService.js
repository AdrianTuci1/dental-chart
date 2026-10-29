const {
    BadRequestError,
    ConflictError,
    NotFoundError,
    ServiceUnavailableError,
} = require('../../../shared/errors/AppError');
const { Medic } = require('../../identity/domain/Medic');
const { snapshotFromSubscription } = require('../domain/Subscription');

const BILLING_INTERVALS = new Set(['month', 'year']);
const BLOCKING_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid', 'paused']);

/**
 * Subscription lifecycle and account status.
 *
 * The plan is written only by the Stripe webhook or by a provider-side migration.
 * Checkout receives an interval, never a price or an account id from the browser.
 */
class BillingService {
    constructor({
        config,
        medicRepository,
        gateway,
        now = () => new Date(),
    } = {}) {
        this.config = config || {};
        this.medicRepository = medicRepository;
        this.gateway = gateway;
        this.now = now;
    }

    isEnabled() {
        return Boolean(this.gateway);
    }

    async getStatus(medicId) {
        const record = await this.requireMedic(medicId);
        const medic = new Medic(record);
        const billing = this.config.billing || {};

        return {
            enabled: this.isEnabled(),
            provider: billing.provider || 'stripe',
            plan: medic.subscriptionPlan,
            status: medic.subscriptionStatus,
            licensed: medic.isLicensed(),
            interval: medic.billingInterval,
            currentPeriodEnd: record.subscriptionCurrentPeriodEnd || null,
            cancelAtPeriodEnd: Boolean(record.subscriptionCancelAtPeriodEnd),
            prices: billing.prices || { month: 30, year: 300 },
            currency: billing.currency || 'usd',
            portalAvailable: this.isEnabled() && Boolean(record.stripeCustomerId),
        };
    }

    async createCheckout(medicId, interval) {
        this.assertEnabled();

        if (!BILLING_INTERVALS.has(interval)) {
            throw new BadRequestError('interval must be "month" or "year"');
        }

        const record = await this.requireMedic(medicId);
        const medic = new Medic(record);

        if (record.status === 'disabled') {
            throw new ConflictError('Disabled accounts cannot start a subscription');
        }

        if (record.stripeSubscriptionId && BLOCKING_STATUSES.has(medic.subscriptionStatus)) {
            throw new ConflictError('A subscription already exists; use the billing portal to change it');
        }

        const priceId = this.priceIdFor(interval);
        if (!priceId) {
            throw new ServiceUnavailableError(`No Stripe price is configured for the ${interval} interval`);
        }

        let customerId = record.stripeCustomerId;

        if (!customerId) {
            const customer = await this.gateway.createCustomer({
                email: record.email,
                name: record.name,
                medicId: record.id,
            });

            customerId = customer.id;

            await this.medicRepository.updateMedic(record.id, {
                ...record,
                stripeCustomerId: customerId,
            });
        }

        const session = await this.gateway.createCheckoutSession({
            customerId,
            priceId,
            medicId: record.id,
        });

        if (!session?.url) {
            throw new ServiceUnavailableError('Stripe did not return a checkout URL');
        }

        return { url: session.url };
    }

    async createPortal(medicId) {
        this.assertEnabled();

        const record = await this.requireMedic(medicId);
        if (!record.stripeCustomerId) {
            throw new BadRequestError('This account has no billing history yet');
        }

        const session = await this.gateway.createPortalSession({
            customerId: record.stripeCustomerId,
        });

        if (!session?.url) {
            throw new ServiceUnavailableError('Stripe did not return a portal URL');
        }

        return { url: session.url };
    }

    async handleWebhook({ rawBody, signature } = {}) {
        this.assertEnabled();

        if (!rawBody || !signature) {
            throw new BadRequestError('Stripe signature and raw body are required');
        }

        let event;

        try {
            event = this.gateway.constructEvent(rawBody, signature);
        } catch {
            throw new BadRequestError('Invalid Stripe signature');
        }

        await this.handleEvent(event);

        return { received: true, type: event.type };
    }

    async handleEvent(event) {
        const object = event?.data?.object || {};

        switch (event.type) {
            case 'checkout.session.completed': {
                if (!object.subscription) {
                    return;
                }

                const subscription = await this.gateway.retrieveSubscription(object.subscription);

                await this.syncSubscription({
                    medicId: object.metadata?.medicId || object.client_reference_id,
                    customerId: object.customer,
                    subscription,
                });
                return;
            }
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                await this.syncSubscription({
                    medicId: object.metadata?.medicId,
                    customerId: object.customer,
                    subscription: object,
                });
                return;
            }
            case 'invoice.payment_failed': {
                await this.markPastDue({
                    medicId: object.subscription_details?.metadata?.medicId || object.metadata?.medicId,
                    customerId: object.customer,
                });
                return;
            }
            case 'invoice.paid': {
                if (!object.subscription) {
                    return;
                }

                const subscription = await this.gateway.retrieveSubscription(object.subscription);

                await this.syncSubscription({
                    medicId: subscription.metadata?.medicId,
                    customerId: subscription.customer,
                    subscription,
                });
                return;
            }
            default:
                return;
        }
    }

    async syncSubscription({ medicId = null, customerId = null, subscription = {} } = {}) {
        let record = medicId ? await this.medicRepository.getMedicById(medicId) : null;

        if (!record && customerId) {
            record = await this.medicRepository.getMedicByStripeCustomerId(customerId);
        }

        if (!record) {
            console.warn('[BillingService] subscription event has no matching account', {
                medicId,
                customerId,
            });
            return null;
        }

        const snapshot = snapshotFromSubscription(subscription);
        const interval = this.intervalFor(subscription) || record.billingInterval || null;

        return this.medicRepository.updateMedic(record.id, {
            ...record,
            stripeCustomerId: customerId || record.stripeCustomerId || null,
            stripeSubscriptionId: subscription.id || record.stripeSubscriptionId || null,
            subscriptionPlan: snapshot.plan,
            subscriptionStatus: snapshot.status,
            subscriptionCurrentPeriodEnd: snapshot.currentPeriodEnd,
            subscriptionCancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
            billingInterval: snapshot.plan === 'free' ? null : interval,
            subscriptionUpdatedAt: this.now().toISOString(),
        });
    }

    async markPastDue({ medicId = null, customerId = null } = {}) {
        let record = medicId ? await this.medicRepository.getMedicById(medicId) : null;

        if (!record && customerId) {
            record = await this.medicRepository.getMedicByStripeCustomerId(customerId);
        }

        if (!record) {
            return null;
        }

        return this.medicRepository.updateMedic(record.id, {
            ...record,
            subscriptionPlan: 'pro',
            subscriptionStatus: 'past_due',
            subscriptionUpdatedAt: this.now().toISOString(),
        });
    }

    intervalFor(subscription) {
        const priceId = subscription?.items?.data?.[0]?.price?.id;
        return this.gateway?.intervalForPrice(priceId) || null;
    }

    priceIdFor(interval) {
        return this.config.billing?.priceIds?.[interval] || null;
    }

    assertEnabled() {
        if (!this.gateway) {
            throw new ServiceUnavailableError('Billing is not configured on this deployment');
        }
    }

    async requireMedic(medicId) {
        const record = medicId ? await this.medicRepository.getMedicById(medicId) : null;

        if (!record) {
            throw new NotFoundError('Account not found');
        }

        return record;
    }
}

module.exports = BillingService;
