process.env.ENABLE_TELEMETRY = 'false';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.PLATFORM_ADMIN_EMAILS = 'root@clinic.test';

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

    const profile = await request(app)
        .get('/api/auth/me')
        .set(authHeaders(response.body.token));

    return { token: response.body.token, id: profile.body.id, email };
};

describe('platform admin accounts API', () => {
    let admin;
    let member;

    beforeEach(async () => {
        inMemoryDynamo.reset();
        admin = await register('Root Admin', 'root@clinic.test');
        member = await register('Dr. Member', 'member@clinic.test');
    });

    it('rejects anonymous requests and regular accounts', async () => {
        const anonymous = await request(app).get('/api/admin/accounts');
        expect(anonymous.statusCode).toEqual(401);

        const forbidden = await request(app)
            .get('/api/admin/accounts')
            .set(authHeaders(member.token));

        expect(forbidden.statusCode).toEqual(403);
    });

    it('lists accounts without credential material', async () => {
        const response = await request(app)
            .get('/api/admin/accounts')
            .set(authHeaders(admin.token));

        expect(response.statusCode).toEqual(200);
        expect(response.body.map((account) => account.email).sort()).toEqual([
            'member@clinic.test',
            'root@clinic.test',
        ]);
        expect(response.body[0]).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            status: 'active',
            createdAt: expect.any(String),
        });
        expect(JSON.stringify(response.body)).not.toContain('passwordHash');
        expect(JSON.stringify(response.body)).not.toContain('apiKey');
    });

    it('filters accounts by search and status', async () => {
        const search = await request(app)
            .get('/api/admin/accounts?search=member')
            .set(authHeaders(admin.token));

        expect(search.statusCode).toEqual(200);
        expect(search.body).toHaveLength(1);
        expect(search.body[0].email).toBe('member@clinic.test');

        const disabled = await request(app)
            .patch(`/api/admin/accounts/${member.id}`)
            .set(authHeaders(admin.token))
            .send({ status: 'disabled' });

        expect(disabled.statusCode).toEqual(200);

        const filtered = await request(app)
            .get('/api/admin/accounts?status=disabled')
            .set(authHeaders(admin.token));

        expect(filtered.body.map((account) => account.id)).toEqual([member.id]);
    });

    it('disables an account, blocks its sessions and re-enables it', async () => {
        const disabled = await request(app)
            .patch(`/api/admin/accounts/${member.id}`)
            .set(authHeaders(admin.token))
            .send({ status: 'disabled' });

        expect(disabled.statusCode).toEqual(200);
        expect(disabled.body.status).toBe('disabled');

        const login = await request(app)
            .post('/api/auth/login')
            .send({ email: 'member@clinic.test', password: 'supersecret' });

        expect(login.statusCode).toEqual(401);
        expect(login.body.error).toMatch(/disabled/i);

        const existingSession = await request(app)
            .get('/api/auth/me')
            .set(authHeaders(member.token));

        expect(existingSession.statusCode).toEqual(401);

        const enabled = await request(app)
            .patch(`/api/admin/accounts/${member.id}`)
            .set(authHeaders(admin.token))
            .send({ status: 'active' });

        expect(enabled.statusCode).toEqual(200);

        const loginAgain = await request(app)
            .post('/api/auth/login')
            .send({ email: 'member@clinic.test', password: 'supersecret' });

        expect(loginAgain.statusCode).toEqual(200);
    });

    it('refuses an invalid status and self-disable', async () => {
        const invalid = await request(app)
            .patch(`/api/admin/accounts/${member.id}`)
            .set(authHeaders(admin.token))
            .send({ status: 'deleted' });

        expect(invalid.statusCode).toEqual(400);

        const self = await request(app)
            .patch(`/api/admin/accounts/${admin.id}`)
            .set(authHeaders(admin.token))
            .send({ status: 'disabled' });

        expect(self.statusCode).toEqual(400);
    });

    it('deletes an account and refuses to delete the signed-in administrator', async () => {
        const deleted = await request(app)
            .delete(`/api/admin/accounts/${member.id}`)
            .set(authHeaders(admin.token));

        expect(deleted.statusCode).toEqual(204);

        const list = await request(app)
            .get('/api/admin/accounts')
            .set(authHeaders(admin.token));

        expect(list.body.map((account) => account.id)).toEqual([admin.id]);

        const self = await request(app)
            .delete(`/api/admin/accounts/${admin.id}`)
            .set(authHeaders(admin.token));

        expect(self.statusCode).toEqual(400);
    });
});
