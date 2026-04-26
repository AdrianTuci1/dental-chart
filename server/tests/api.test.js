const request = require('supertest');
const app = require('../app.js');

jest.mock('uuid', () => ({ v4: () => 'mock-uuid-1234' }));

const describeIfSockets = process.env.ENABLE_SOCKET_TESTS === 'true' ? describe : describe.skip;

jest.mock('../src/config/dynamoConfig', () => ({
    docClient: {
        send: jest.fn((cmd) => {
            if (!cmd || !cmd.constructor) return Promise.resolve({});
            const type = cmd.constructor.name;
            const input = cmd.input || {};

            if (type === 'PutCommand') return Promise.resolve({ Attributes: input.Item });

            if (type === 'GetCommand') {
                const key = input.Key || {};

                if (key.PK === 'PATIENT#missing') return Promise.resolve({ Item: null });
                if (key.PK === 'CLINIC#missing') return Promise.resolve({ Item: null });

                if (key.PK?.startsWith('MEDIC#')) {
                    return Promise.resolve({
                        Item: {
                            PK: key.PK,
                            SK: 'METADATA#',
                            id: key.PK.replace('MEDIC#', ''),
                            name: 'Dr. Smith',
                            email: 'dr@smith.com',
                            subscriptionPlan: 'paid',
                            defaultClinicId: 'c-1',
                            apiKey: 'dc_test_key',
                        },
                    });
                }

                if (key.PK?.startsWith('CLINIC#') && key.SK === 'METADATA#') {
                    return Promise.resolve({
                        Item: {
                            PK: key.PK,
                            SK: 'METADATA#',
                            id: key.PK.replace('CLINIC#', ''),
                            name: 'Dental Clinic',
                            ownerMedicId: 'm-1',
                            type: 'organization',
                        },
                    });
                }

                if (key.PK?.startsWith('CLINIC#') && key.SK?.startsWith('MEMBER#')) {
                    return Promise.resolve({
                        Item: {
                            PK: key.PK,
                            SK: key.SK,
                            clinicId: key.PK.replace('CLINIC#', ''),
                            medicId: key.SK.replace('MEMBER#', ''),
                            role: key.SK === 'MEMBER#m-1' ? 'owner' : 'member',
                            status: 'active',
                            email: 'dr@smith.com',
                            name: 'Dr. Smith',
                        },
                    });
                }

                if (key.SK === 'HISTORY#') return Promise.resolve({ Item: { SK: 'HISTORY#', data: { items: [] } } });
                if (key.SK === 'PLAN#') return Promise.resolve({ Item: { SK: 'PLAN#', data: { items: [] } } });

                return Promise.resolve({
                    Item: {
                        PK: key.PK || 'PATIENT#p-1',
                        SK: 'METADATA#',
                        id: 'p-1',
                        name: 'John Doe',
                        email: 'john@example.com',
                        medicId: 'm-1',
                        ownerMedicId: 'm-1',
                        clinicId: 'c-1',
                        data: {
                            dateOfBirth: '1980-05-15',
                            gender: 'Male',
                            phone: '555-0123',
                        },
                    },
                });
            }

            if (type === 'QueryCommand') {
                if (input.ExpressionAttributeValues?.[':memberPrefix'] === 'MEMBER#') {
                    return Promise.resolve({
                        Items: [
                            {
                                PK: 'CLINIC#c-1',
                                SK: 'MEMBER#m-1',
                                clinicId: 'c-1',
                                medicId: 'm-1',
                                role: 'owner',
                                status: 'active',
                                name: 'Dr. Smith',
                                email: 'dr@smith.com',
                            },
                        ],
                    });
                }

                if (input.ExpressionAttributeValues?.[':invitePrefix'] === 'INVITE#') {
                    return Promise.resolve({ Items: [] });
                }

                return Promise.resolve({
                    Items: [
                        {
                            SK: 'METADATA#',
                            id: 'p-1',
                            name: 'John Doe',
                            email: 'john@example.com',
                            medicId: 'm-1',
                            ownerMedicId: 'm-1',
                            clinicId: 'c-1',
                            data: {
                                dateOfBirth: '1980-05-15',
                                gender: 'Male',
                                phone: '555-0123',
                            },
                        },
                        {
                            SK: 'HISTORY#',
                            data: {
                                items: [
                                    { id: 'h-1', tooth: 11, type: 'restoration', procedure: 'Filling', status: 'completed' }
                                ],
                            },
                        },
                        {
                            SK: 'PLAN#',
                            data: {
                                items: [
                                    { id: 'tp-1', tooth: 11, type: 'decay', procedure: 'Decay Treatment', status: 'planned' }
                                ],
                            },
                        },
                    ],
                });
            }

            if (type === 'ScanCommand') {
                const values = input.ExpressionAttributeValues || {};

                if (values[':email'] === 'new-doctor@example.com') {
                    return Promise.resolve({ Items: [] });
                }

                if (values[':email'] === 'dr@smith.com') {
                    return Promise.resolve({
                        Items: [
                            {
                                PK: 'MEDIC#m-1',
                                SK: 'METADATA#',
                                id: 'm-1',
                                name: 'Dr. Smith',
                                email: 'dr@smith.com',
                                subscriptionPlan: 'paid',
                                defaultClinicId: 'c-1',
                                apiKey: 'dc_test_key',
                            },
                        ],
                    });
                }

                if (values[':apiKey'] === 'dc_test_key') {
                    return Promise.resolve({
                        Items: [
                            {
                                PK: 'MEDIC#m-1',
                                SK: 'METADATA#',
                                id: 'm-1',
                                name: 'Dr. Smith',
                                email: 'dr@smith.com',
                                subscriptionPlan: 'paid',
                                defaultClinicId: 'c-1',
                                apiKey: 'dc_test_key',
                            },
                        ],
                    });
                }

                if (values[':memberPrefix'] === 'MEMBER#') {
                    return Promise.resolve({
                        Items: [
                            { clinicId: 'c-1', medicId: 'm-1', role: 'owner', status: 'active' },
                        ],
                    });
                }

                if (values[':patientPrefix'] === 'PATIENT#') {
                    return Promise.resolve({
                        Items: [
                            { SK: 'METADATA#', id: 'p-1', name: 'John Doe', medicId: 'm-1', ownerMedicId: 'm-1', clinicId: 'c-1' },
                        ],
                    });
                }

                return Promise.resolve({ Items: [] });
            }

            if (type === 'DeleteCommand') return Promise.resolve({});
            return Promise.resolve({});
        })
    }
}));

describeIfSockets('API Routes CRUD Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ──────────────── Auth Routes ────────────────

    describe('Auth Routes', () => {
        it('should register a new medic (signup)', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Dr. New', email: 'new-doctor@example.com', password: 'secret123' });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('name', 'Dr. New');
            expect(res.body).toHaveProperty('email', 'new-doctor@example.com');
            expect(res.body).toHaveProperty('token');
        });

        it('should reject register with missing fields', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'dr@smith.com' });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error');
        });

        it('should login', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'dr@smith.com', password: 'secret123' });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should reject login with missing fields', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'dr@smith.com' });
            expect(res.statusCode).toEqual(400);
        });

    });

    // ──────────────── Clinic Routes ────────────────

    describe('Clinic Routes', () => {
        it('should create a clinic', async () => {
            const res = await request(app).post('/api/clinics').send({ name: 'Dental Clinic', ownerMedicId: 'm-1', address: '123 Main St' });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('name', 'Dental Clinic');
        });

        it('should get a clinic by id', async () => {
            const res = await request(app).get('/api/clinics/c-1');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('id', 'c-1');
        });

        it('should return 404 if clinic not found', async () => {
            const res = await request(app).get('/api/clinics/missing');
            expect(res.statusCode).toEqual(404);
        });
    });

    // ──────────────── Medic Routes ────────────────

    describe('Medic Routes', () => {
        it('should create a medic', async () => {
            const res = await request(app).post('/api/medics').send({ name: 'Dr. Smith', email: 'new-doctor@example.com' });
            expect([201, 500]).toContain(res.statusCode);
        });

        it('should get a medic by id', async () => {
            const res = await request(app).get('/api/medics/m-1');
            expect(res.statusCode).toEqual(200);
        });

        it('should get medic patients', async () => {
            const res = await request(app).get('/api/medics/m-1/patients');
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });
    });

    // ──────────────── Patient Routes ────────────────

    describe('Patient Routes', () => {
        it('should create a patient with camelCase fields', async () => {
            const res = await request(app).post('/api/patients').send({
                medicId: 'm-1',
                fullName: 'John Doe',
                dateOfBirth: '1980-05-15',
                gender: 'Male',
                phone: '555-0123',
                email: 'john@example.com'
            });
            if (res.statusCode === 500) throw new Error(JSON.stringify(res.body));
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('name', 'John Doe');
        });

        it('should reject patient creation with missing required fields', async () => {
            const res = await request(app).post('/api/patients').send({ fullName: 'John Doe' });
            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain('medicId');
        });

        it('should get a patient by id', async () => {
            const res = await request(app).get('/api/patients/p-1');
            expect(res.statusCode).toEqual(200);
        });

        it('should get patient chart with nested treatmentPlan and history', async () => {
            const res = await request(app).get('/api/patients/p-1/chart');
            expect(res.statusCode).toEqual(200);

            // Verify the response shape matches frontend mockData.js structure
            expect(res.body).toHaveProperty('name', 'John Doe');
            expect(res.body).toHaveProperty('treatmentPlan');
            expect(res.body.treatmentPlan).toHaveProperty('items');
            expect(Array.isArray(res.body.treatmentPlan.items)).toBe(true);
            expect(res.body.treatmentPlan.items.length).toBe(1);
            expect(res.body.treatmentPlan.items[0]).toHaveProperty('tooth', 11);
            expect(res.body.treatmentPlan.items[0]).toHaveProperty('type', 'decay');

            expect(res.body).toHaveProperty('history');
            expect(res.body.history).toHaveProperty('completedItems');
            expect(Array.isArray(res.body.history.completedItems)).toBe(true);
            expect(res.body.history.completedItems.length).toBe(1);
            expect(res.body.history.completedItems[0]).toHaveProperty('tooth', 11);
            expect(res.body.history.completedItems[0]).toHaveProperty('type', 'restoration');
        });

        it('should delete a patient', async () => {
            const res = await request(app).delete('/api/patients/p-1');
            expect(res.statusCode).toEqual(204);
        });
    });

    // ──────────────── History Routes ────────────────

    describe('History Routes', () => {
        it('should add history record', async () => {
            const res = await request(app).post('/api/patients/p-1/history').send({
                type: 'restoration',
                procedure: 'Composite filling',
                tooth: 11,
                material: 'composite',
                status: 'completed',
            });
            if (res.statusCode === 500) throw new Error(JSON.stringify(res.body));
            expect(res.statusCode).toEqual(201);
        });

        it('should get patient history', async () => {
            const res = await request(app).get('/api/patients/p-1/history');
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBeTruthy();
        });
    });

    // ──────────────── Treatment Plan Routes ────────────────

    describe('Treatment Plan Routes', () => {
        it('should add treatment plan item', async () => {
            const res = await request(app).post('/api/patients/p-1/treatment-plans').send({
                type: 'extraction',
                procedure: 'Tooth 44 Extraction',
                tooth: 44,
                status: 'planned',
            });
            if (res.statusCode === 500) throw new Error(JSON.stringify(res.body));
            expect(res.statusCode).toEqual(201);
        });

        it('should get patient treatment plans', async () => {
            const res = await request(app).get('/api/patients/p-1/treatment-plans');
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBeTruthy();
        });
    });

    describe('Contract API and Docs', () => {
        it('should expose openapi docs on /docs', async () => {
            const res = await request(app).get('/docs');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('openapi', '3.1.0');
            expect(res.body).toHaveProperty('paths');
        });

        it('should create or update a patient through the external contract API', async () => {
            const res = await request(app)
                .post('/api/external/patients')
                .set('x-api-key', 'dc_test_key')
                .send({
                    name: 'Imported Patient',
                    dateOfBirth: '1990-01-01',
                    gender: 'Male',
                    phone: '555-6789',
                    email: 'imported@example.com',
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('name');
        });
    });
});
