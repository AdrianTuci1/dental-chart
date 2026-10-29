jest.mock('uuid', () => ({ v4: () => 'mock-uuid-1234' }));

const PatientService = require('../src/modules/patients/application/PatientService');
const MedicService = require('../src/modules/identity/application/MedicService');

describe('Service business rules', () => {
    describe('PatientService', () => {
        const patientDependencies = (service) => {
            service.historyRepository = { updateHistory: jest.fn().mockResolvedValue({}) };
            service.treatmentPlanRepository = { updateTreatmentPlan: jest.fn().mockResolvedValue({}) };
            service.patientRepository = {
                createPatient: jest.fn().mockResolvedValue({}),
                countPatientsByOwnerMedicIdInClinic: jest.fn().mockResolvedValue(5),
            };
            service.getPatientFullRecord = jest.fn().mockResolvedValue({ id: 'p-1' });
        };

        it('enforces the free plan cap in a personal workspace', async () => {
            const service = new PatientService();
            patientDependencies(service);

            service.medicRepository = {
                getMedicById: jest.fn().mockResolvedValue({
                    id: 'm-free',
                    subscriptionPlan: 'free',
                    defaultClinicId: 'c-1',
                }),
            };
            service.clinicService = {
                resolveClinicForMedic: jest.fn().mockResolvedValue({
                    id: 'c-1',
                    type: 'personal',
                    ownerMedicId: 'm-free',
                }),
            };

            await expect(service.createPatient({
                medicId: 'm-free',
                name: 'Blocked Patient',
            })).rejects.toMatchObject({
                message: 'Free accounts can only manage up to 5 patients per workspace',
                statusCode: 403,
            });
        });

        it('lifts the cap in the licensed account personal workspace', async () => {
            const service = new PatientService();
            patientDependencies(service);

            service.medicRepository = {
                getMedicById: jest.fn().mockResolvedValue({
                    id: 'm-licensed',
                    subscriptionPlan: 'pro',
                    subscriptionStatus: 'active',
                    defaultClinicId: 'c-1',
                }),
            };
            service.clinicService = {
                resolveClinicForMedic: jest.fn().mockResolvedValue({
                    id: 'c-1',
                    type: 'personal',
                    ownerMedicId: 'm-licensed',
                }),
            };

            await service.createPatient({ medicId: 'm-licensed', name: 'Allowed Patient' });

            expect(service.patientRepository.countPatientsByOwnerMedicIdInClinic).not.toHaveBeenCalled();
            expect(service.patientRepository.createPatient).toHaveBeenCalled();
        });

        it('lifts the cap for members of a shared workspace owned by a licensed account', async () => {
            const service = new PatientService();
            patientDependencies(service);
            service.patientRepository.countPatientsByOwnerMedicIdInClinic.mockResolvedValue(50);

            service.medicRepository = {
                getMedicById: jest.fn().mockImplementation(async (id) => {
                    if (id === 'm-owner') {
                        return { id: 'm-owner', subscriptionPlan: 'pro', subscriptionStatus: 'active' };
                    }

                    return { id: 'm-member', subscriptionPlan: 'free', defaultClinicId: 'c-personal' };
                }),
            };
            service.clinicService = {
                resolveClinicForMedic: jest.fn().mockResolvedValue({
                    id: 'c-org',
                    type: 'organization',
                    ownerMedicId: 'm-owner',
                }),
            };

            await service.createPatient({ medicId: 'm-member', name: 'Team Patient' });

            expect(service.patientRepository.countPatientsByOwnerMedicIdInClinic).not.toHaveBeenCalled();
            expect(service.patientRepository.createPatient).toHaveBeenCalled();
        });

        it('keeps the cap in a member personal workspace even when the organization is licensed', async () => {
            const service = new PatientService();
            patientDependencies(service);

            service.medicRepository = {
                getMedicById: jest.fn().mockResolvedValue({
                    id: 'm-member',
                    subscriptionPlan: 'free',
                    defaultClinicId: 'c-personal',
                }),
            };
            service.clinicService = {
                resolveClinicForMedic: jest.fn().mockResolvedValue({
                    id: 'c-personal',
                    type: 'personal',
                    ownerMedicId: 'm-member',
                }),
            };

            await expect(service.createPatient({
                medicId: 'm-member',
                name: 'Blocked Personal Patient',
            })).rejects.toMatchObject({ statusCode: 403 });

            expect(service.patientRepository.countPatientsByOwnerMedicIdInClinic)
                .toHaveBeenCalledWith('m-member', 'c-personal');
        });

        it('creates a patient in the resolved clinic for paid accounts', async () => {
            const service = new PatientService();

            service.medicRepository = {
                getMedicById: jest.fn().mockResolvedValue({
                    id: 'm-paid',
                    subscriptionPlan: 'paid',
                    defaultClinicId: 'c-1',
                }),
            };
            service.clinicService = {
                resolveClinicForMedic: jest.fn().mockResolvedValue({ id: 'c-1' }),
            };
            service.patientRepository = {
                createPatient: jest.fn().mockResolvedValue({}),
            };
            service.historyRepository = {
                updateHistory: jest.fn().mockResolvedValue({}),
            };
            service.treatmentPlanRepository = {
                updateTreatmentPlan: jest.fn().mockResolvedValue({}),
            };
            service.getPatientFullRecord = jest.fn().mockResolvedValue({
                id: 'p-1',
                name: 'Created Patient',
                clinicId: 'c-1',
                ownerMedicId: 'm-paid',
            });

            const result = await service.createPatient({
                medicId: 'm-paid',
                name: 'Created Patient',
            });

            expect(service.patientRepository.createPatient).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Created Patient',
                    clinicId: 'c-1',
                    ownerMedicId: 'm-paid',
                })
            );
            expect(result).toHaveProperty('clinicId', 'c-1');
        });
    });

    describe('MedicService', () => {
        it('requires ownership transfer when deleting an owner with active clinic members', async () => {
            const service = new MedicService();

            service.getMedic = jest.fn().mockResolvedValue({ id: 'm-1', name: 'Owner' });
            service.clinicService = {
                listOwnedClinics: jest.fn().mockResolvedValue([{ id: 'c-1', name: 'Shared Clinic' }]),
                getClinicMembers: jest.fn().mockResolvedValue([
                    { medicId: 'm-1', status: 'active', role: 'owner' },
                    { medicId: 'm-2', status: 'active', role: 'member' },
                ]),
                transferOwnership: jest.fn(),
                listMedicClinics: jest.fn().mockResolvedValue([]),
                removeMedicFromClinic: jest.fn(),
            };
            service.patientService = {
                deletePatientsByOwnerMedicId: jest.fn(),
            };
            service.medicRepository = {
                deleteMedic: jest.fn(),
            };

            await expect(service.deleteMedicAndPatients('m-1')).rejects.toMatchObject({
                statusCode: 409,
            });
        });

        it('ignores license fields supplied when creating an account', async () => {
            const service = new MedicService();

            service.medicRepository = {
                getMedicByEmail: jest.fn().mockResolvedValue(null),
                createMedic: jest.fn().mockImplementation(async (data) => ({ ...data, createdAt: 'now' })),
                updateMedic: jest.fn().mockImplementation(async (_id, data) => data),
            };
            service.clinicService = {
                createClinic: jest.fn().mockResolvedValue({ id: 'c-1' }),
            };
            service.patientSeedService = {
                seedForMedic: jest.fn().mockResolvedValue(),
            };

            await service.createMedic({
                name: 'Dr. Smith',
                email: 'smith@clinic.test',
                subscriptionPlan: 'pro',
                subscriptionStatus: 'active',
                billingInterval: 'year',
                stripeCustomerId: 'cus_123',
                stripeSubscriptionId: 'sub_123',
            });

            const stored = service.medicRepository.createMedic.mock.calls[0][0];
            expect(stored.subscriptionPlan).toBe('free');
            expect(stored.subscriptionStatus).toBeUndefined();
            expect(stored.billingInterval).toBeUndefined();
            expect(stored.stripeCustomerId).toBeUndefined();
            expect(stored.stripeSubscriptionId).toBeUndefined();
        });

        it('rotates the API key for a medic', async () => {
            const service = new MedicService();

            service.getMedic = jest.fn().mockResolvedValue({
                id: 'm-1',
                name: 'Dr. Smith',
                apiKeyHash: 'oldhash',
                apiKeyPrefix: 'dc_old_key',
            });
            service.medicRepository = {
                updateMedic: jest.fn().mockImplementation(async (_id, payload) => payload),
            };

            const result = await service.rotateApiKey('m-1');

            expect(result.apiKey).toMatch(/^dc_/);
            expect(result.apiKeyMasked).toBeTruthy();
            expect(service.medicRepository.updateMedic).toHaveBeenCalled();
            expect(result.apiKeyHash).toBeUndefined();
            expect(result.apiKeyLastRotatedAt).toBeTruthy();
        });
    });
});
