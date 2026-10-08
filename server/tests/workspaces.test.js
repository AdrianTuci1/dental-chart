const ClinicService = require('../src/services/ClinicService');
const MedicService = require('../src/services/MedicService');
const PatientService = require('../src/services/PatientService');

jest.spyOn(PatientService.prototype, 'deletePatientsByClinicId').mockResolvedValue(undefined);

const personalWorkspace = (overrides = {}) => ({
    id: 'c-default',
    name: "Dr. Smith's Clinic",
    type: 'personal',
    ownerMedicId: 'm-1',
    ...overrides,
});

const sharedWorkspace = (overrides = {}) => ({
    id: 'c-shared',
    name: 'City Dental',
    type: 'organization',
    isDefault: false,
    ownerMedicId: 'm-1',
    ...overrides,
});

const buildClinicService = ({ clinic, membership = { role: 'owner', status: 'active' }, owner } = {}) => {
    const service = new ClinicService();

    service.clinicRepository = {
        getClinicById: jest.fn().mockResolvedValue(clinic || null),
        getClinicMember: jest.fn().mockResolvedValue(membership),
        deleteClinic: jest.fn().mockResolvedValue(undefined),
        updateClinic: jest.fn().mockResolvedValue(clinic),
        listClinicMembers: jest.fn().mockResolvedValue([]),
        listClinicInvitations: jest.fn().mockResolvedValue([]),
        createClinic: jest.fn().mockResolvedValue(clinic),
        upsertClinicMember: jest.fn().mockResolvedValue(undefined),
    };
    service.medicRepository = {
        getMedicById: jest.fn().mockResolvedValue(owner || { id: 'm-1', name: 'Dr. Smith', email: 'dr@smith.com' }),
    };

    return service;
};

describe('Default workspace rules', () => {
    describe('deleteClinic', () => {
        it('refuses to delete the workspace flagged as default', async () => {
            const service = buildClinicService({ clinic: personalWorkspace({ isDefault: true }) });

            await expect(service.deleteClinic('c-default', 'm-1')).rejects.toMatchObject({
                statusCode: 409,
                message: 'The default workspace can only be removed together with the account',
            });
            expect(service.clinicRepository.deleteClinic).not.toHaveBeenCalled();
        });

        it('refuses to delete a legacy personal clinic even without the flag', async () => {
            const service = buildClinicService({
                clinic: personalWorkspace({ isDefault: undefined }),
                owner: { id: 'm-1', defaultClinicId: 'c-default' },
            });

            await expect(service.deleteClinic('c-default', 'm-1')).rejects.toMatchObject({ statusCode: 409 });
            expect(service.clinicRepository.deleteClinic).not.toHaveBeenCalled();
        });

        it('deletes a shared workspace owned by the requester', async () => {
            const service = buildClinicService({ clinic: sharedWorkspace() });

            const result = await service.deleteClinic('c-shared', 'm-1');

            expect(result).toEqual({ deleted: true, clinicId: 'c-shared' });
            expect(service.clinicRepository.deleteClinic).toHaveBeenCalledWith('c-shared');
        });
    });

    describe('inviteMedic', () => {
        it('refuses invitations into the default workspace', async () => {
            const service = buildClinicService({ clinic: personalWorkspace({ isDefault: true }) });

            await expect(service.inviteMedic('c-default', { invitedEmail: 'peer@clinic.com' }, 'm-1')).rejects.toMatchObject({
                statusCode: 403,
                message: 'Collaborators can only be invited to a shared workspace',
            });
        });

        it('creates an invitation for a shared workspace', async () => {
            const service = buildClinicService({ clinic: sharedWorkspace() });
            service.clinicRepository.createInvitation = jest.fn().mockResolvedValue({ id: 'i-1', status: 'pending' });
            service.medicRepository.getMedicByEmail = jest.fn().mockResolvedValue(null);

            const invitation = await service.inviteMedic(
                'c-shared',
                { invitedEmail: 'peer@clinic.com', invitedByMedicId: 'm-1' },
                'm-1'
            );

            expect(invitation).toMatchObject({ status: 'pending' });
            expect(service.clinicRepository.createInvitation).toHaveBeenCalledWith('c-shared', expect.objectContaining({
                invitedEmail: 'peer@clinic.com',
            }));
        });
    });

    describe('createSharedClinic', () => {
        it('normalises the payload into a non-default organization', async () => {
            const service = buildClinicService();
            service.createClinic = jest.fn().mockResolvedValue({ id: 'c-2' });

            await service.createSharedClinic({
                name: '  City Dental  ',
                ownerMedicId: 'm-1',
                type: 'personal',
                isDefault: true,
                address: 'Street 1',
            });

            expect(service.createClinic).toHaveBeenCalledWith({
                address: 'Street 1',
                name: 'City Dental',
                ownerMedicId: 'm-1',
                type: 'organization',
                isDefault: false,
            });
        });

        it('requires a name', async () => {
            const service = buildClinicService();

            await expect(service.createSharedClinic({ name: '   ', ownerMedicId: 'm-1' })).rejects.toMatchObject({
                statusCode: 400,
            });
        });
    });
});

describe('MedicService.ensureDefaultWorkspace', () => {
    const buildMedicService = (medic) => {
        const service = new MedicService();

        service.medicRepository = {
            getMedicById: jest.fn().mockResolvedValue(medic),
            updateMedic: jest.fn().mockResolvedValue(medic),
        };
        service.clinicService = {
            getClinicById: jest.fn().mockResolvedValue(medic?.defaultClinicId ? personalWorkspace() : null),
            listOwnedClinics: jest.fn().mockResolvedValue([]),
            createClinic: jest.fn().mockResolvedValue(personalWorkspace()),
            markAsDefaultWorkspace: jest.fn().mockResolvedValue(personalWorkspace()),
        };
        service.patientService = {
            assignPatientsWithoutClinic: jest.fn().mockResolvedValue(0),
        };

        return service;
    };

    it('skips accounts that already carry the migration stamp', async () => {
        const service = buildMedicService({
            id: 'm-1',
            name: 'Dr. Smith',
            defaultClinicId: 'c-default',
            workspaceMigrationVersion: MedicService.WORKSPACE_MIGRATION_VERSION,
        });

        await service.ensureDefaultWorkspace('m-1');

        expect(service.clinicService.createClinic).not.toHaveBeenCalled();
        expect(service.medicRepository.updateMedic).not.toHaveBeenCalled();
        expect(service.patientService.assignPatientsWithoutClinic).not.toHaveBeenCalled();
    });

    it('creates the default workspace and backfills patients for legacy accounts', async () => {
        const service = buildMedicService({ id: 'm-1', name: 'Dr. Smith' });

        await service.ensureDefaultWorkspace('m-1');

        expect(service.clinicService.createClinic).toHaveBeenCalledWith(expect.objectContaining({
            ownerMedicId: 'm-1',
            type: 'personal',
            isDefault: true,
        }));
        expect(service.medicRepository.updateMedic).toHaveBeenCalledWith('m-1', expect.objectContaining({
            defaultClinicId: 'c-default',
            workspaceMigrationVersion: MedicService.WORKSPACE_MIGRATION_VERSION,
        }));
        expect(service.patientService.assignPatientsWithoutClinic).toHaveBeenCalledWith('m-1', 'c-default');
    });

    it('links an existing personal clinic instead of creating a duplicate', async () => {
        const service = buildMedicService({ id: 'm-1', name: 'Dr. Smith' });
        service.clinicService.listOwnedClinics = jest.fn().mockResolvedValue([personalWorkspace()]);

        await service.ensureDefaultWorkspace('m-1');

        expect(service.clinicService.createClinic).not.toHaveBeenCalled();
        expect(service.clinicService.markAsDefaultWorkspace).toHaveBeenCalledWith('c-default');
    });
});

describe('PatientService.getPatientsByClinic', () => {
    const buildPatientService = ({ medic, clinics, clinicPatients, ownedPatients }) => {
        const service = new PatientService();

        service.medicRepository = { getMedicById: jest.fn().mockResolvedValue(medic) };
        service.clinicService = { listMedicClinics: jest.fn().mockResolvedValue(clinics) };
        service.patientRepository = {
            getPatientsByClinicIds: jest.fn().mockResolvedValue(clinicPatients),
            getPatientsByMedicId: jest.fn().mockResolvedValue(ownedPatients),
        };

        return service;
    };

    it('rejects a workspace the medic is not a member of', async () => {
        const service = buildPatientService({
            medic: { id: 'm-1', defaultClinicId: 'c-default' },
            clinics: [personalWorkspace()],
            clinicPatients: [],
            ownedPatients: [],
        });

        await expect(service.getPatientsByClinic('m-1', 'c-other')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('returns only the patients of the requested workspace', async () => {
        const service = buildPatientService({
            medic: { id: 'm-1', defaultClinicId: 'c-default' },
            clinics: [personalWorkspace(), sharedWorkspace()],
            clinicPatients: [{ id: 'p-shared', clinicId: 'c-shared' }],
            ownedPatients: [{ id: 'p-legacy' }],
        });

        const patients = await service.getPatientsByClinic('m-1', 'c-shared');

        expect(patients).toEqual([{ id: 'p-shared', clinicId: 'c-shared' }]);
        expect(service.patientRepository.getPatientsByMedicId).not.toHaveBeenCalled();
    });

    it('includes pre-workspace patients in the default workspace only', async () => {
        const service = buildPatientService({
            medic: { id: 'm-1', defaultClinicId: 'c-default' },
            clinics: [personalWorkspace(), sharedWorkspace()],
            clinicPatients: [{ id: 'p-1', clinicId: 'c-default' }],
            ownedPatients: [{ id: 'p-1', clinicId: 'c-default' }, { id: 'p-legacy' }],
        });

        const patients = await service.getPatientsByClinic('m-1', 'c-default');

        expect(patients.map((patient) => patient.id).sort()).toEqual(['p-1', 'p-legacy']);
    });
});

describe('Default workspace lifetime', () => {
    it('detaches the default workspace when the account is deleted', async () => {
        const service = new MedicService();

        service.medicRepository = {
            getMedicById: jest.fn().mockResolvedValue({ id: 'm-1', name: 'Dr. Smith', defaultClinicId: 'c-default' }),
            deleteMedic: jest.fn().mockResolvedValue(undefined),
        };
        service.clinicService = {
            listOwnedClinics: jest.fn().mockResolvedValue([personalWorkspace({ isDefault: true })]),
            getClinicMembers: jest.fn().mockResolvedValue([{ medicId: 'm-1', status: 'active', role: 'owner' }]),
            listMedicClinics: jest.fn().mockResolvedValue([personalWorkspace({ isDefault: true })]),
            removeMedicFromClinic: jest.fn().mockResolvedValue(undefined),
            transferOwnership: jest.fn(),
        };
        service.patientService = { deletePatientsByOwnerMedicId: jest.fn().mockResolvedValue(undefined) };
        service.sessionService = { revokeAllForMedic: jest.fn().mockResolvedValue(1) };

        await service.deleteMedicAndPatients('m-1');

        expect(service.clinicService.removeMedicFromClinic).toHaveBeenCalledWith('c-default', 'm-1');
        expect(service.sessionService.revokeAllForMedic).toHaveBeenCalledWith('m-1');
        expect(service.medicRepository.deleteMedic).toHaveBeenCalledWith('m-1');
    });

    it('removes the workspace record once its last member leaves with the account', async () => {
        const service = buildClinicService({ clinic: personalWorkspace({ isDefault: true }) });
        service.clinicRepository.deleteClinicMember = jest.fn().mockResolvedValue(undefined);

        await service.removeMedicFromClinic('c-default', 'm-1');

        expect(service.clinicRepository.deleteClinicMember).toHaveBeenCalledWith('c-default', 'm-1');
        expect(service.clinicRepository.deleteClinic).toHaveBeenCalledWith('c-default');
    });
});
