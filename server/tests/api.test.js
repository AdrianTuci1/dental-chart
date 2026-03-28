const request = require('supertest');
const app = require('../app.js');

jest.mock('uuid', () => ({ v4: () => 'mock-uuid-1234' }));

jest.mock('../src/config/dynamoConfig', () => ({
    docClient: {
        send: jest.fn((cmd) => {
            if (!cmd || !cmd.constructor) return Promise.resolve({});
            const type = cmd.constructor.name;
            const input = cmd.input || {};

            if (type === 'PutCommand') return Promise.resolve({ Attributes: input.Item });

            if (type === 'GetCommand') {
                const sk = input.Key ? input.Key.SK : '';
                if (sk === 'HISTORY#') return Promise.resolve({ Item: { SK: 'HISTORY#', data: { items: [] } } });
                if (sk === 'PLAN#') return Promise.resolve({ Item: { SK: 'PLAN#', data: { items: [] } } });

                return Promise.resolve({
                    Item: {
                        PK: input.Key ? input.Key.PK : 'PATIENT#p-1',
                        SK: 'METADATA#',
                        id: 'test-id',
                        fullName: 'John Doe',
                        name: 'Dr. Smith',
                        email: 'dr@smith.com',
                        data: {
                            dateOfBirth: '1980-05-15',
                            gender: 'male',
                            phone: '555-0123'
                        }
                    }
                });
            }

            if (type === 'QueryCommand') return Promise.resolve({
                Items: [
                    {
                        SK: 'METADATA#',
                        id: 'test-id',
                        fullName: 'John Doe',
                        email: 'john@example.com'
                    },
                    {
                        SK: 'HISTORY#',
                        data: {
                            items: [
                                { id: 'h-1', tooth: 11, type: 'restoration', procedure: 'Filling', status: 'completed' }
                            ]
                        }
                    },
                    {
                        SK: 'PLAN#',
                        data: {
                            items: [
                                { id: 'tp-1', tooth: 11, type: 'decay', procedure: 'Decay Treatment', status: 'planned' }
                            ]
                        }
                    },
                ]
            });

            if (type === 'ScanCommand') return Promise.resolve({
                Items: [
                    { SK: 'METADATA#', id: 'p-1', fullName: 'John Doe', medicId: 'm-1' },
                ]
            });

            if (type === 'DeleteCommand') return Promise.resolve({});
            return Promise.resolve({});
        })
    }
}));

describe('API Routes CRUD Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ──────────────── Auth Routes ────────────────

    describe('Auth Routes', () => {
        it('should register a new medic (signup)', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Dr. Smith', email: 'dr@smith.com', password: 'secret123' });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('name', 'Dr. Smith');
            expect(res.body).toHaveProperty('email', 'dr@smith.com');
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
            const res = await request(app).post('/api/clinics').send({ name: 'Dental Clinic', address: '123 Main St' });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('name', 'Dental Clinic');
        });

        it('should get a clinic by id', async () => {
            const res = await request(app).get('/api/clinics/c-1');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('id', 'test-id');
        });

        it('should return 404 if clinic not found', async () => {
            const { docClient } = require('../src/config/dynamoConfig');
            docClient.send.mockResolvedValueOnce({ Item: null });
            const res = await request(app).get('/api/clinics/c-999');
            expect(res.statusCode).toEqual(404);
        });
    });

    // ──────────────── Medic Routes ────────────────

    describe('Medic Routes', () => {
        it('should create a medic', async () => {
            const res = await request(app).post('/api/medics').send({ name: 'Dr. Smith', email: 'dr@smith.com' });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('name', 'Dr. Smith');
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
                gender: 'male',
                phone: '555-0123',
                email: 'john@example.com'
            });
            if (res.statusCode === 500) throw new Error(JSON.stringify(res.body));
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('fullName', 'John Doe');
        });

        it('should reject patient creation with missing required fields', async () => {
            const res = await request(app).post('/api/patients').send({ fullName: 'John Doe' });
            expect(res.statusCode).toEqual(500);
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
            expect(res.body).toHaveProperty('fullName', 'John Doe');
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
});
