const BillingService = require('../src/modules/billing/application/BillingService');
const { Medic } = require('../src/modules/identity/domain/Medic');

const billingConfig = {
    billing: {
        provider: 'stripe',
        enabled: true,
        prices: { month: 30, year: 300 },
        currency: 'usd',
        priceIds: { month: 'price_month', year: 'price_year' },
        successUrl: 'https://app.test/?billing=success',
        cancelUrl: 'https://app.test/?billing=cancelled',
        portalReturnUrl: 'https://app.test/?billing=portal',
    },
};

const makeRepository = (records = []) => {
    const store = new Map(records.map((record) => [record.id, { ...record }]));

    return {
        store,
        getMedicById: jest.fn(async (id) => store.get(id) || null),
        getMedicByStripeCustomerId: jest.fn(async (customerId) => (
            [...store.values()].find((record) => record.stripeCustomerId === customerId) || null
        )),
        updateMedic: jest.fn(async (id, data) => {
            const updated = { ...data, id };
            store.set(id, updated);
            return updated;
        }),
    };
};

const makeGateway = (event = null) => ({
    createCustomer: jest.fn().mockResolvedValue({ id: 'cus_1' }),
    createCheckoutSession: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.test/session' }),
    createPortalSession: jest.fn().mockResolvedValue({ url: 'https://billing.stripe.test/session' }),
    retrieveSubscription: jest.fn().mockResolvedValue({
        id: 'sub_1',
        customer: 'cus_1',
        status: 'active',
        current_period_end: 1893456000,
        cancel_at_period_end: false,
        metadata: { medicId: 'm-1' },
        items: { data: [{ price: { id: 'price_month' } }] },
    }),
    constructEvent: jest.fn((rawBody, signature) => {
        if (signature !== 'valid-signature') {
            throw new Error('bad signature');
        }

        return event;
    }),
    intervalForPrice: jest.fn((priceId) => {
        if (priceId === 'price_month') return 'month';
        if (priceId === 'price_year') return 'year';
        return null;
    }),
});

const subscriptionEvent = (status = 'active', priceId = 'price_month') => ({
    type: 'customer.subscription.updated',
    data: {
        object: {
            id: 'sub_1',
            customer: 'cus_1',
            status,
            current_period_end: 1893456000,
            cancel_at_period_end: false,
            metadata: { medicId: 'm-1' },
            items: { data: [{ price: { id: priceId } }] },
        },
    },
});

describe('BillingService', () => {
    it('reports a disabled deployment without failing the status request', async () => {
        const repository = makeRepository([{ id: 'm-1', subscriptionPlan: 'free' }]);
        const service = new BillingService({
            config: { billing: { provider: 'stripe', prices: { month: 30, year: 300 }, currency: 'usd' } },
            medicRepository: repository,
            gateway: null,
        });

        const status = await service.getStatus('m-1');

        expect(status).toMatchObject({
            enabled: false,
            plan: 'free',
            licensed: false,
            prices: { month: 30, year: 300 },
        });
    });

    it('refuses checkout when Stripe is not configured', async () => {
        const service = new BillingService({
            config: billingConfig,
            medicRepository: makeRepository([{ id: 'm-1' }]),
            gateway: null,
        });

        await expect(service.createCheckout('m-1', 'month')).rejects.toMatchObject({
            statusCode: 503,
        });
    });

    it('creates one Stripe customer and returns the checkout URL', async () => {
        const repository = makeRepository([{
            id: 'm-1',
            name: 'Dr. One',
            email: 'one@clinic.test',
            subscriptionPlan: 'free',
        }]);
        const gateway = makeGateway();
        const service = new BillingService({ config: billingConfig, medicRepository: repository, gateway });

        const result = await service.createCheckout('m-1', 'year');

        expect(gateway.createCustomer).toHaveBeenCalledWith({
            email: 'one@clinic.test',
            name: 'Dr. One',
            medicId: 'm-1',
        });
        expect(gateway.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
            customerId: 'cus_1',
            priceId: 'price_year',
            medicId: 'm-1',
        }));
        expect(result.url).toBe('https://checkout.stripe.test/session');
        expect(repository.store.get('m-1').stripeCustomerId).toBe('cus_1');
    });

    it('rejects a second checkout while a subscription is active', async () => {
        const service = new BillingService({
            config: billingConfig,
            medicRepository: makeRepository([{
                id: 'm-1',
                subscriptionPlan: 'pro',
                subscriptionStatus: 'active',
                stripeSubscriptionId: 'sub_1',
                stripeCustomerId: 'cus_1',
            }]),
            gateway: makeGateway(),
        });

        await expect(service.createCheckout('m-1', 'month')).rejects.toMatchObject({
            statusCode: 409,
        });
    });

    it('applies an active subscription and its interval', async () => {
        const repository = makeRepository([{
            id: 'm-1',
            subscriptionPlan: 'free',
            stripeCustomerId: 'cus_1',
        }]);
        const gateway = makeGateway(subscriptionEvent('active', 'price_year'));
        const service = new BillingService({ config: billingConfig, medicRepository: repository, gateway });

        await service.handleWebhook({ rawBody: Buffer.from('{}'), signature: 'valid-signature' });

        const record = repository.store.get('m-1');
        expect(record).toMatchObject({
            subscriptionPlan: 'pro',
            subscriptionStatus: 'active',
            billingInterval: 'year',
            stripeSubscriptionId: 'sub_1',
        });
        expect(record.subscriptionCurrentPeriodEnd).toBe(new Date(1893456000 * 1000).toISOString());
        expect(new Medic(record).isLicensed()).toBe(true);
    });

    it('moves the account back to free when the subscription is canceled', async () => {
        const repository = makeRepository([{
            id: 'm-1',
            subscriptionPlan: 'pro',
            subscriptionStatus: 'active',
            stripeSubscriptionId: 'sub_1',
            billingInterval: 'month',
        }]);
        const gateway = makeGateway(subscriptionEvent('canceled'));
        const service = new BillingService({ config: billingConfig, medicRepository: repository, gateway });

        await service.handleWebhook({ rawBody: Buffer.from('{}'), signature: 'valid-signature' });

        expect(repository.store.get('m-1')).toMatchObject({
            subscriptionPlan: 'free',
            subscriptionStatus: 'canceled',
            billingInterval: null,
        });
        expect(new Medic(repository.store.get('m-1')).isLicensed()).toBe(false);
    });

    it('keeps a failed payment visible without granting the license', async () => {
        const repository = makeRepository([{
            id: 'm-1',
            subscriptionPlan: 'pro',
            subscriptionStatus: 'active',
            stripeCustomerId: 'cus_1',
        }]);
        const gateway = makeGateway({
            type: 'invoice.payment_failed',
            data: {
                object: {
                    customer: 'cus_1',
                    subscription_details: { metadata: { medicId: 'm-1' } },
                },
            },
        });
        const service = new BillingService({ config: billingConfig, medicRepository: repository, gateway });

        await service.handleWebhook({ rawBody: Buffer.from('{}'), signature: 'valid-signature' });

        const record = repository.store.get('m-1');
        expect(record.subscriptionStatus).toBe('past_due');
        expect(new Medic(record).isLicensed()).toBe(false);
    });

    it('rejects a webhook with an invalid signature', async () => {
        const service = new BillingService({
            config: billingConfig,
            medicRepository: makeRepository([{ id: 'm-1' }]),
            gateway: makeGateway(subscriptionEvent()),
        });

        await expect(service.handleWebhook({
            rawBody: Buffer.from('{}'),
            signature: 'wrong',
        })).rejects.toMatchObject({ statusCode: 400 });
    });
});
