/**
 * End-to-end check of the Postgres driver: the real routes, services and repositories
 * run against pg-mem, so a breaking change in the adapter fails here without a database.
 */
process.env.DB_DRIVER = 'postgres';
process.env.DATABASE_URL = 'postgres://user:pass@pg.internal:5432/pixtooth';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.ENABLE_TELEMETRY = 'false';

jest.mock('pg', () => {
    const { newDb } = require('pg-mem');
    const db = newDb();
    const { Pool } = db.adapters.createPg();

    return { Pool };
});

const request = require('supertest');
const app = require('../app');

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

describe('Postgres API flow', () => {
    it('registers an account and keeps patients in the Postgres document table', async () => {
        const registered = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Dr. Postgres', email: 'postgres@clinic.test', password: 'supersecret' });

        expect(registered.statusCode).toEqual(201);
        const headers = authHeaders(registered.body.token);

        const profile = await request(app).get('/api/auth/me').set(headers);
        expect(profile.statusCode).toEqual(200);
        expect(profile.body.clinics).toHaveLength(1);

        const created = await request(app)
            .post('/api/patients')
            .set(headers)
            .send({ medicId: registered.body.id, name: 'Postgres Patient', dateOfBirth: '1980-01-01' });

        expect(created.statusCode).toEqual(201);

        const list = await request(app)
            .get(`/api/medics/${registered.body.id}/patients`)
            .set(headers);

        expect(list.statusCode).toEqual(200);
        expect(list.body.map((patient) => patient.name)).toContain('Postgres Patient');

        const config = await request(app).get('/api/config').set(headers);

        expect(config.statusCode).toEqual(200);
        expect(config.body.database).toMatchObject({
            driver: 'postgres',
            target: { host: 'pg.internal', database: 'pixtooth' },
        });

        const clinic = await request(app)
            .post('/api/clinics')
            .set(headers)
            .send({ name: 'Postgres Clinic' });

        expect(clinic.statusCode).toEqual(201);

        const invitation = await request(app)
            .post(`/api/clinics/${clinic.body.id}/invitations`)
            .set(headers)
            .send({
                invitedEmail: 'peer@clinic.test',
                invitedByMedicId: registered.body.id,
                role: 'member',
            });

        expect(invitation.statusCode).toEqual(201);

        const clinicDetail = await request(app)
            .get(`/api/clinics/${clinic.body.id}`)
            .set(headers);

        expect(clinicDetail.statusCode).toEqual(200);
        expect(clinicDetail.body.invitations).toHaveLength(1);

        const deletedPatient = await request(app)
            .delete(`/api/patients/${created.body.id}`)
            .set(headers);

        expect(deletedPatient.statusCode).toEqual(204);
    });
});
