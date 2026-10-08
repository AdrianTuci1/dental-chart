process.env.ENABLE_TELEMETRY = 'false';

const inMemoryDynamo = require('./helpers/inMemoryDynamo');

jest.mock('../src/config/dynamoConfig', () => ({
    docClient: require('./helpers/inMemoryDynamo'),
}));

const request = require('supertest');
const app = require('../app.js');
const { signAuthToken } = require('../src/utils/auth');

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

describe('Workspace API flow', () => {
    let token;
    let medic;

    beforeEach(async () => {
        inMemoryDynamo.reset();

        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Dr. Mira Vale', email: 'mira@clinic.test', password: 'supersecret' });

        expect(res.statusCode).toEqual(201);
        token = res.body.token;
        medic = res.body;
    });

    it('gives every new account a default workspace', async () => {
        const res = await request(app).get('/api/auth/me').set(authHeaders(token));

        expect(res.statusCode).toEqual(200);
        expect(res.body.defaultClinicId).toBeTruthy();
        expect(res.body.clinics).toHaveLength(1);
        expect(res.body.clinics[0]).toMatchObject({
            id: res.body.defaultClinicId,
            type: 'personal',
            isDefault: true,
        });
        expect(res.body.clinics[0].members).toEqual([
            expect.objectContaining({ medicId: medic.id, role: 'owner', status: 'active' }),
        ]);
    });

    it('creates additional workspaces as shared, owned by the caller', async () => {
        const res = await request(app)
            .post('/api/clinics')
            .set(authHeaders(token))
            .send({
                name: 'City Dental',
                ownerMedicId: 'someone-else',
                type: 'personal',
                isDefault: true,
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toMatchObject({
            name: 'City Dental',
            type: 'organization',
            isDefault: false,
            ownerMedicId: medic.id,
        });

        const me = await request(app).get('/api/auth/me').set(authHeaders(token));
        expect(me.body.clinics).toHaveLength(2);
    });

    it('keeps collaborators out of the default workspace', async () => {
        const profile = await request(app).get('/api/auth/me').set(authHeaders(token));

        const blocked = await request(app)
            .post(`/api/clinics/${profile.body.defaultClinicId}/invitations`)
            .set(authHeaders(token))
            .send({ invitedEmail: 'peer@clinic.test', invitedByMedicId: medic.id, role: 'member' });

        expect(blocked.statusCode).toEqual(403);
        expect(blocked.body.error).toMatch(/shared workspace/);

        const created = await request(app)
            .post('/api/clinics')
            .set(authHeaders(token))
            .send({ name: 'City Dental' });

        const allowed = await request(app)
            .post(`/api/clinics/${created.body.id}/invitations`)
            .set(authHeaders(token))
            .send({ invitedEmail: 'peer@clinic.test', invitedByMedicId: medic.id, role: 'member' });

        expect(allowed.statusCode).toEqual(201);
        expect(allowed.body).toMatchObject({ invitedEmail: 'peer@clinic.test', status: 'pending' });
    });

    it('refuses to delete the default workspace but allows shared ones', async () => {
        const profile = await request(app).get('/api/auth/me').set(authHeaders(token));
        const created = await request(app)
            .post('/api/clinics')
            .set(authHeaders(token))
            .send({ name: 'City Dental' });

        const blockedDeletion = await request(app)
            .delete(`/api/clinics/${profile.body.defaultClinicId}`)
            .set(authHeaders(token));

        expect(blockedDeletion.statusCode).toEqual(409);
        expect(blockedDeletion.body.error).toMatch(/together with the account/);

        const sharedDeletion = await request(app)
            .delete(`/api/clinics/${created.body.id}`)
            .set(authHeaders(token));

        expect(sharedDeletion.statusCode).toEqual(200);
        expect(sharedDeletion.body).toEqual({ deleted: true, clinicId: created.body.id });
    });

    it('scopes the patient list to the requested workspace', async () => {
        const profile = await request(app).get('/api/auth/me').set(authHeaders(token));
        const defaultClinicId = profile.body.defaultClinicId;

        const created = await request(app)
            .post('/api/clinics')
            .set(authHeaders(token))
            .send({ name: 'City Dental' });

        const patient = await request(app)
            .post('/api/patients')
            .set(authHeaders(token))
            .send({ medicId: medic.id, name: 'Shared Workspace Patient', clinicId: created.body.id });

        expect(patient.statusCode).toEqual(201);
        expect(patient.body.clinicId).toEqual(created.body.id);

        const sharedList = await request(app)
            .get(`/api/medics/${medic.id}/patients?clinicId=${created.body.id}`)
            .set(authHeaders(token));

        expect(sharedList.statusCode).toEqual(200);
        expect(sharedList.body.map((entry) => entry.name)).toEqual(['Shared Workspace Patient']);

        const defaultList = await request(app)
            .get(`/api/medics/${medic.id}/patients?clinicId=${defaultClinicId}`)
            .set(authHeaders(token));

        expect(defaultList.statusCode).toEqual(200);
        expect(defaultList.body.length).toBeGreaterThan(0);
        expect(defaultList.body.every((entry) => entry.clinicId === defaultClinicId)).toBe(true);

        const foreignList = await request(app)
            .get(`/api/medics/${medic.id}/patients?clinicId=clinic-does-not-exist`)
            .set(authHeaders(token));

        expect(foreignList.statusCode).toEqual(403);

        const unscopedList = await request(app)
            .get(`/api/medics/${medic.id}/patients`)
            .set(authHeaders(token));

        expect(unscopedList.body.length).toEqual(defaultList.body.length + sharedList.body.length);
    });

    it('migrates an existing account the first time its profile is read', async () => {
        inMemoryDynamo.seed([
            {
                PK: 'MEDIC#legacy-1',
                SK: 'METADATA#',
                id: 'legacy-1',
                name: 'Legacy Dentist',
                email: 'legacy@clinic.test',
                subscriptionPlan: 'free',
            },
            {
                PK: 'PATIENT#legacy-p1',
                SK: 'METADATA#',
                id: 'legacy-p1',
                name: 'Legacy Patient',
                medicId: 'legacy-1',
                ownerMedicId: 'legacy-1',
            },
        ]);

        const legacyToken = signAuthToken({ id: 'legacy-1', email: 'legacy@clinic.test' });

        const firstRead = await request(app).get('/api/auth/me').set(authHeaders(legacyToken));

        expect(firstRead.statusCode).toEqual(200);
        expect(firstRead.body.defaultClinicId).toBeTruthy();
        expect(firstRead.body.clinics).toHaveLength(1);
        expect(firstRead.body.clinics[0]).toMatchObject({ type: 'personal', isDefault: true });

        const legacyPatients = await request(app)
            .get('/api/medics/legacy-1/patients')
            .set(authHeaders(legacyToken));

        expect(legacyPatients.body).toHaveLength(1);
        expect(legacyPatients.body[0]).toMatchObject({
            id: 'legacy-p1',
            clinicId: firstRead.body.defaultClinicId,
        });

        // The stamp keeps later profile reads read-only.
        const commandsBefore = inMemoryDynamo.sentCommands.length;
        await request(app).get('/api/auth/me').set(authHeaders(legacyToken));
        const writesAfterSecondRead = inMemoryDynamo.sentCommands
            .slice(commandsBefore)
            .filter((entry) => entry.type === 'PutCommand');

        expect(writesAfterSecondRead).toHaveLength(0);
    });
});
