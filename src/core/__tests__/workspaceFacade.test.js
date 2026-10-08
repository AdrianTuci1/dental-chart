import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppFacade } from '../AppFacade';
import { useAppStore } from '../store/appStore';
import { patientService, clinicService } from '../../api';

vi.mock('../../api', () => ({
    patientService: {
        getPatients: vi.fn(),
        createPatient: vi.fn(),
        updatePatient: vi.fn(),
        deletePatient: vi.fn(),
    },
    clinicService: {
        createClinic: vi.fn(),
    },
    medicService: {},
    aiService: {},
}));

const createdPatient = (overrides = {}) => ({
    id: 'p-1',
    name: 'New Patient',
    medicId: 'm-1',
    clinicId: 'c-shared',
    treatmentPlan: { items: [] },
    history: { completedItems: [] },
    chart: { teeth: {} },
    ...overrides,
});

describe('AppFacade workspace scoping', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAppStore.getState().setActiveClinicId(null);
        useAppStore.getState().setPatients([]);
    });

    it('loads the patient list for one workspace only', async () => {
        patientService.getPatients.mockResolvedValue([]);

        await AppFacade.patient.loadAll('m-1', 'c-shared');

        expect(patientService.getPatients).toHaveBeenCalledWith('m-1', 'c-shared');
    });

    it('loads every workspace when no workspace is selected', async () => {
        patientService.getPatients.mockResolvedValue([]);

        await AppFacade.patient.loadAll('m-1');

        expect(patientService.getPatients).toHaveBeenCalledWith('m-1', null);
    });

    it('stores the workspace the patient belongs to', async () => {
        patientService.getPatients.mockResolvedValue([createdPatient()]);

        const patients = await AppFacade.patient.loadAll('m-1', 'c-shared');

        expect(patients[0]).toMatchObject({ id: 'p-1', clinicId: 'c-shared' });
        expect(useAppStore.getState().patients[0].clinicId).toBe('c-shared');
    });

    it('creates new patients inside the active workspace', async () => {
        useAppStore.getState().setActiveClinicId('c-active');
        patientService.createPatient.mockResolvedValue(createdPatient({ clinicId: 'c-active' }));

        await AppFacade.patient.add({ name: 'New Patient' }, 'm-1');

        expect(patientService.createPatient).toHaveBeenCalledWith(
            expect.objectContaining({ clinicId: 'c-active', medicId: 'm-1', name: 'New Patient' })
        );
    });

    it('keeps an explicitly chosen workspace over the active one', async () => {
        useAppStore.getState().setActiveClinicId('c-active');
        patientService.createPatient.mockResolvedValue(createdPatient());

        await AppFacade.patient.add({ name: 'New Patient', clinicId: 'c-chosen' }, 'm-1');

        expect(patientService.createPatient).toHaveBeenCalledWith(
            expect.objectContaining({ clinicId: 'c-chosen' })
        );
    });

    it('omits clinicId when the account has no workspace yet', async () => {
        patientService.createPatient.mockResolvedValue(createdPatient());

        await AppFacade.patient.add({ name: 'New Patient' }, 'm-1');

        expect(patientService.createPatient).toHaveBeenCalledWith(
            expect.not.objectContaining({ clinicId: expect.anything() })
        );
    });

    it('creates a workspace through the clinic service', async () => {
        clinicService.createClinic.mockResolvedValue({ id: 'c-new', name: 'City Dental' });

        const created = await AppFacade.clinic.create({ name: 'City Dental' });

        expect(clinicService.createClinic).toHaveBeenCalledWith({ name: 'City Dental' });
        expect(created).toMatchObject({ id: 'c-new' });
    });
});
