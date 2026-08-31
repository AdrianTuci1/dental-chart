const MedicService = require('../src/services/MedicService');

const buildService = (existing) => {
    const service = new MedicService();

    service.medicRepository = {
        updateMedic: jest.fn().mockImplementation(async (id, data) => ({ ...data, id })),
    };
    service.createMedic = jest.fn().mockImplementation(async (data) => ({ id: 'm-new', ...data }));
    service.getMedicByEmail = jest.fn().mockResolvedValue(existing || null);

    return service;
};

const claims = (overrides = {}) => ({
    id: 'google-1',
    email: 'dana@clinic.test',
    emailVerified: true,
    name: 'Dana Vale',
    ...overrides,
});

describe('MedicService.findOrCreateGoogleAccount', () => {
    it('links Google to an existing password account without touching anything else', async () => {
        const service = buildService({
            id: 'm-1',
            email: 'dana@clinic.test',
            name: 'Dr. Dana',
            passwordHash: 'bcrypt:xxx',
            defaultClinicId: 'c-default',
        });

        const { medic, isNewlyCreated } = await service.findOrCreateGoogleAccount(claims());

        expect(isNewlyCreated).toBe(false);
        expect(medic.id).toBe('m-1');
        expect(medic.defaultClinicId).toBe('c-default');
        expect(medic.passwordHash).toBe('bcrypt:xxx');
        expect(medic.googleId).toBe('google-1');
        expect(medic.authProviders).toEqual(['password', 'google']);
        expect(service.createMedic).not.toHaveBeenCalled();
    });

    it('is idempotent when the account is already linked to the same Google identity', async () => {
        const service = buildService({ id: 'm-1', email: 'dana@clinic.test', googleId: 'google-1' });

        const { medic, isNewlyCreated } = await service.findOrCreateGoogleAccount(claims());

        expect(isNewlyCreated).toBe(false);
        expect(medic.id).toBe('m-1');
        expect(service.medicRepository.updateMedic).not.toHaveBeenCalled();
    });

    it('refuses to attach a second Google identity to one email', async () => {
        const service = buildService({ id: 'm-1', email: 'dana@clinic.test', googleId: 'google-other' });

        await expect(service.findOrCreateGoogleAccount(claims())).rejects.toMatchObject({ statusCode: 409 });
    });

    it('creates a passwordless account for an unknown email', async () => {
        const service = buildService(null);

        const { medic, isNewlyCreated } = await service.findOrCreateGoogleAccount(claims());

        expect(isNewlyCreated).toBe(true);
        expect(service.createMedic).toHaveBeenCalledWith(expect.objectContaining({
            email: 'dana@clinic.test',
            name: 'Dana Vale',
            passwordHash: null,
            googleId: 'google-1',
            authProviders: ['google'],
        }));
        expect(medic.id).toBe('m-new');
    });

    it('derives a name from the email when Google does not supply one', async () => {
        const service = buildService(null);

        await service.findOrCreateGoogleAccount(claims({ name: '' }));

        expect(service.createMedic).toHaveBeenCalledWith(expect.objectContaining({ name: 'dana' }));
    });

    it('refuses an unverified Google email, which is what makes linking safe', async () => {
        const service = buildService({ id: 'm-1', email: 'dana@clinic.test' });

        await expect(service.findOrCreateGoogleAccount(claims({ emailVerified: false })))
            .rejects.toMatchObject({ statusCode: 403 });
        expect(service.medicRepository.updateMedic).not.toHaveBeenCalled();
    });
});
