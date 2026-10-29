process.env.ENABLE_TELEMETRY = 'false';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';

const inMemoryDynamo = require('./helpers/inMemoryDynamo');

jest.mock('../src/shared/infrastructure/dynamoClient', () => ({
    docClient: require('./helpers/inMemoryDynamo'),
}));

const request = require('supertest');
const app = require('../app');

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const register = async (name, email) => {
    const response = await request(app)
        .post('/api/auth/register')
        .send({ name, email, password: 'supersecret' });

    expect(response.statusCode).toEqual(201);
    return { token: response.body.token, email };
};

describe('billing API', () => {
    let account;

    beforeEach(async () => {
        inMemoryDynamo.reset();
        account = await register('Dr. Billing', 'billing@clinic.test');
    });

    it('requires a session', async () => {
        const response = await request(app).get('/api/billing/status');
        expect(response.statusCode).toEqual(401);
    });

    it('reports the free plan when Stripe is not configured', async () => {
        const response = await request(app)
            .get('/api/billing/status')
            .set(authHeaders(account.token));

        expect(response.statusCode).toEqual(200);
        expect(response.body).toMatchObject({
            enabled: false,
            plan: 'free',
            licensed: false,
            prices: { month: 30, year: 300 },
            currency: 'usd',
        });
    });

    it('refuses checkout and portal while Stripe is not configured', async () => {
        const checkout = await request(app)
            .post('/api/billing/checkout')
            .set(authHeaders(account.token))
            .send({ interval: 'month' });

        expect(checkout.statusCode).toEqual(503);

        const portal = await request(app)
            .post('/api/billing/portal')
            .set(authHeaders(account.token));

        expect(portal.statusCode).toEqual(503);
    });

    it('refuses a webhook while Stripe is not configured', async () => {
        const response = await request(app)
            .post('/api/billing/webhook')
            .set('stripe-signature', 'test')
            .send({ type: 'customer.subscription.updated' });

        expect(response.statusCode).toEqual(503);
    });
});
