process.env.ENABLE_TELEMETRY = 'false';

const inMemoryDynamo = require('./helpers/inMemoryDynamo');

jest.mock('../src/config/dynamoConfig', () => ({
    docClient: require('./helpers/inMemoryDynamo'),
}));

const mockVerifyIdToken = jest.fn();

jest.mock('../src/services/GoogleAuthService', () => jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
    isEnabled: () => true,
})));

const request = require('supertest');
const app = require('../app.js');
const SessionService = require('../src/services/SessionService');

// A second service instance proves sessions are not held in the process that issued them.
const reader = new SessionService();

const register = async (email = 'dana@clinic.test') => {
    const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Dr. Dana Vale', email, password: 'supersecret' });

    expect(res.statusCode).toEqual(201);
    return res.body;
};

describe('Session lifecycle over HTTP', () => {
    const originalGrace = process.env.REFRESH_TOKEN_REUSE_GRACE_MS;

    beforeEach(() => {
        inMemoryDynamo.reset();
        mockVerifyIdToken.mockReset();
    });

    afterEach(() => {
        if (originalGrace === undefined) {
            delete process.env.REFRESH_TOKEN_REUSE_GRACE_MS;
        } else {
            process.env.REFRESH_TOKEN_REUSE_GRACE_MS = originalGrace;
        }
    });

    // The theft tests need reuse to be immediate, so the concurrent-tab grace is off.
    const noGrace = () => {
        process.env.REFRESH_TOKEN_REUSE_GRACE_MS = '0';
    };

    it('exchanges a refresh token for a new pair and invalidates the old one', async () => {
        noGrace();
        const { refreshToken } = await register();

        const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
        expect(res.statusCode).toEqual(200);
        expect(res.body.token).toBeTruthy();
        expect(res.body.refreshToken).toBeTruthy();
        expect(res.body.refreshToken).not.toBe(refreshToken);

        const replay = await request(app).post('/api/auth/refresh').send({ refreshToken });
        expect(replay.statusCode).toEqual(401);
        expect(replay.body.reason).toBe('reused');
    });

    it('kills the whole session when a rotated token is replayed', async () => {
        noGrace();
        const first = (await register()).refreshToken;
        const rotated = await request(app).post('/api/auth/refresh').send({ refreshToken: first });
        const current = rotated.body.refreshToken;

        await request(app).post('/api/auth/refresh').send({ refreshToken: first });

        const stolen = await request(app).post('/api/auth/refresh').send({ refreshToken: current });
        expect(stolen.statusCode).toEqual(401);
        expect(stolen.body.reason).toBe('revoked');
    });

    it('keeps every tab signed in when a rotation is replayed right away', async () => {
        const first = (await register()).refreshToken;
        const rotated = await request(app).post('/api/auth/refresh').send({ refreshToken: first });

        // A second tab lost the response and posts the token the first one already used.
        const lateTab = await request(app).post('/api/auth/refresh').send({ refreshToken: first });
        expect(lateTab.statusCode).toEqual(200);
        expect(lateTab.body.refreshToken).not.toBe(rotated.body.refreshToken);

        // The tab that did see the response must still have a working session.
        const stillAlive = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: rotated.body.refreshToken });
        expect(stillAlive.statusCode).toEqual(200);
    });

    it('keeps working when another process reads the session', async () => {
        const { refreshToken } = await register('persist@clinic.test');

        // The store lives in DynamoDB, so a different service instance sees the session.
        const checked = await reader.verify(refreshToken);

        expect(checked.valid).toBe(true);
        expect(checked.record.medicId).toBeTruthy();
    });

    it('slides the expiry window on every refresh', async () => {
        const { refreshToken } = await register('slide@clinic.test');

        const before = await request(app).post('/api/auth/refresh').send({ refreshToken });
        const after = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: before.body.refreshToken });

        expect(after.statusCode).toEqual(200);

        const { record } = await reader.verify(after.body.refreshToken);
        const daysLeft = (new Date(record.expiresAt).getTime() - Date.now()) / 86400000;
        const windowDays = SessionService.windowMs() / 86400000;

        // The replacement carries a full window again, measured from this refresh.
        expect(daysLeft).toBeGreaterThan(windowDays - 1);
        expect(daysLeft).toBeLessThanOrEqual(windowDays);
    });

    it('rejects an unknown refresh token', async () => {
        const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'nope' });
        expect(res.statusCode).toEqual(401);
        expect(res.body.reason).toBe('not_found');
    });

    it('revokes the session on logout', async () => {
        const { refreshToken } = await register('bye@clinic.test');

        const out = await request(app).post('/api/auth/logout').send({ refreshToken });
        expect(out.statusCode).toEqual(200);

        const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
        expect(res.statusCode).toEqual(401);
    });
});

describe('Google sign-in over HTTP', () => {
    const googleClaims = (overrides = {}) => ({
        id: 'google-user-1',
        email: 'dana@clinic.test',
        emailVerified: true,
        name: 'Dana Vale',
        picture: null,
        ...overrides,
    });

    beforeEach(() => {
        inMemoryDynamo.reset();
        mockVerifyIdToken.mockReset();
    });

    it('reuses the password account and keeps the same data', async () => {
        const account = await register();
        mockVerifyIdToken.mockResolvedValue(googleClaims());

        const res = await request(app).post('/api/auth/google').send({ idToken: 'google-id-token' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.id).toBe(account.id);
        expect(res.body.token).toBeTruthy();
        expect(res.body.refreshToken).toBeTruthy();

        // Password login still works for the same account after linking.
        const passwordLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'dana@clinic.test', password: 'supersecret' });
        expect(passwordLogin.statusCode).toEqual(200);
        expect(passwordLogin.body.id).toBe(account.id);
    });

    it('refuses an unverified Google email so accounts cannot be claimed', async () => {
        await register();
        mockVerifyIdToken.mockResolvedValue(googleClaims({ emailVerified: false }));

        const res = await request(app).post('/api/auth/google').send({ idToken: 'google-id-token' });

        expect(res.statusCode).toEqual(403);
    });

    it('creates an account with a default workspace for a new Google email', async () => {
        mockVerifyIdToken.mockResolvedValue(googleClaims({ id: 'google-new', email: 'fresh@clinic.test' }));

        const res = await request(app).post('/api/auth/google').send({ idToken: 'google-id-token' });
        expect(res.statusCode).toEqual(201);

        const me = await request(app).get('/api/auth/me').set({ Authorization: `Bearer ${res.body.token}` });
        expect(me.body.defaultClinicId).toBeTruthy();
        expect(me.body.clinics).toHaveLength(1);
    });

    it('rejects a Google account whose email is already linked to another Google identity', async () => {
        await register();
        mockVerifyIdToken.mockResolvedValue(googleClaims());
        await request(app).post('/api/auth/google').send({ idToken: 'one' });

        mockVerifyIdToken.mockResolvedValue(googleClaims({ id: 'google-impostor' }));
        const res = await request(app).post('/api/auth/google').send({ idToken: 'two' });

        expect(res.statusCode).toEqual(409);
    });

    it('passes through a token Google rejected', async () => {
        mockVerifyIdToken.mockRejectedValue(Object.assign(new Error('bad token'), { statusCode: 401 }));

        const res = await request(app).post('/api/auth/google').send({ idToken: 'garbage' });
        expect(res.statusCode).toEqual(401);
    });
});
