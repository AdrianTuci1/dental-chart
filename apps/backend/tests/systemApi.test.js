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

describe('configuration surface', () => {
    let token;

    beforeEach(async () => {
        inMemoryDynamo.reset();

        const registered = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Dr. Config', email: 'config@clinic.test', password: 'supersecret' });

        expect(registered.statusCode).toEqual(201);
        token = registered.body.token;
    });

    it('requires a session and reports the safe driver and provider state', async () => {
        const anonymous = await request(app).get('/api/config');
        expect(anonymous.statusCode).toEqual(401);

        const response = await request(app)
            .get('/api/config')
            .set(authHeaders(token));

        expect(response.statusCode).toEqual(200);
        expect(response.body).toMatchObject({
            database: { driver: 'dynamo', tableName: 'DentalChart' },
            email: { configured: false, provider: 'none', requestedProvider: null },
            google: { configured: false },
        });
        expect(response.body.auth).toMatchObject({
            jwtSecretConfigured: true,
            refreshTokenSecretConfigured: true,
        });
        expect(JSON.stringify(response.body)).not.toContain('supersecret');
    });

    it('answers a test email with the provider result even when email is inactive', async () => {
        const response = await request(app)
            .post('/api/config/test-email')
            .set(authHeaders(token));

        expect(response.statusCode).toEqual(200);
        expect(response.body).toMatchObject({
            to: 'config@clinic.test',
            delivered: false,
            provider: 'none',
            reason: 'not_configured',
            template: 'configuration_test',
        });
    });

    it('keeps the health probe available without a session and email configured', async () => {
        const response = await request(app).get('/health');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toMatchObject({
            status: 'OK',
            database: { driver: 'dynamo' },
            email: { configured: false, provider: 'none' },
        });
    });
});
