jest.mock('uuid', () => ({ v4: () => 'mock-uuid-1234' }));

const PatientService = require('../src/services/PatientService');
const MedicService = require('../src/services/MedicService');

describe('Service business rules', () => {
    describe('PatientService', () => {
        it('enforces the free plan patient cap', async () => {
            const service = new PatientService();

            service.medicRepository = {
                getMedicById: jest.fn().mockResolvedValue({
                    id: 'm-free',
                    subscriptionPlan: 'free',
                    defaultClinicId: 'c-1',
                }),
            };
            service.patientRepository = {
                countPatientsByOwnerMedicId: jest.fn().mockResolvedValue(5),
            };
            service.clinicService = {
                resolveClinicForMedic: jest.fn(),
            };

            await expect(service.createPatient({
                medicId: 'm-free',
                name: 'Blocked Patient',
            })).rejects.toMatchObject({
                message: 'Free accounts can only manage up to 5 patients',
                statusCode: 403,
            });
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

        it('rotates the API key for a medic', async () => {
            const service = new MedicService();

            service.getMedic = jest.fn().mockResolvedValue({
                id: 'm-1',
                name: 'Dr. Smith',
                apiKey: 'dc_old_key',
            });
            service.medicRepository = {
                updateMedic: jest.fn().mockImplementation(async (_id, payload) => payload),
            };

            const result = await service.rotateApiKey('m-1');

            expect(result.apiKey).toMatch(/^dc_/);
            expect(result.apiKeyMasked).toBeTruthy();
            expect(service.medicRepository.updateMedic).toHaveBeenCalled();
        });
    });
});
