const { Medic } = require('../src/modules/identity/domain/Medic');
const { ApiKey } = require('../src/modules/identity/domain/ApiKey');
const { Password } = require('../src/modules/identity/domain/Password');
const { AuthTokenService } = require('../src/modules/identity/application/AuthTokenService');
const { Clinic, ClinicMembership } = require('../src/modules/clinic/domain/Clinic');
const { PatientChart } = require('../src/modules/patients/domain/Patient');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../src/shared/errors/AppError');
const { toHttpError } = require('../src/shared/http/errorMapper');

describe('identity domain', () => {
    it('never exposes credential columns in the public view', () => {
        const publicMedic = new Medic({
            id: 'm-1',
            name: 'Dr. Smith',
            email: 'dr@smith.com',
            passwordHash: 'hash',
            apiKeyHash: 'key-hash',
            apiKeyPrefix: 'dc_prefix',
            subscriptionPlan: 'paid',
        }).toPublic();

        expect(publicMedic).toEqual({
            id: 'm-1',
            name: 'Dr. Smith',
            email: 'dr@smith.com',
            subscriptionPlan: 'paid',
        });
    });

    it('keeps the password provider when a Google identity is linked', () => {
        const medic = new Medic({ id: 'm-1', email: 'dr@smith.com' });

        expect(medic.linkGoogle('google-1')).toEqual({
            googleId: 'google-1',
            googleEmailVerified: true,
            authProviders: ['password', 'google'],
        });
    });

    it('recognises an expired password reset even when no request was made', () => {
        expect(new Medic({}).isPasswordResetExpired()).toBe(true);
        expect(new Medic({ passwordResetExpiresAt: new Date(Date.now() + 60000).toISOString() }).isPasswordResetExpired()).toBe(false);
    });

    it('hashes API keys and masks them for display', () => {
        const apiKey = ApiKey.generate();

        expect(apiKey.rawKey).toMatch(/^dc_/);
        expect(apiKey.hash).toBe(ApiKey.hash(apiKey.rawKey));
        expect(ApiKey.mask(apiKey.rawKey)).toBe(`${apiKey.rawKey.slice(0, 6)}...${apiKey.rawKey.slice(-4)}`);
    });

    it('enforces the minimum password length through a typed error', () => {
        expect(() => Password.assertValid('short')).toThrow(BadRequestError);
        expect(() => Password.assertValid('long enough')).not.toThrow();
    });

    it('signs and verifies an access token', () => {
        const tokens = new AuthTokenService({ secret: 'test-secret', expiresIn: '15m' });
        const token = tokens.sign({ id: 'm-1', email: 'dr@smith.com' });

        expect(tokens.verify(token)).toMatchObject({ sub: 'm-1', email: 'dr@smith.com', type: 'auth' });
        expect(tokens.medicIdFromAuthHeader(`Bearer ${token}`)).toBe('m-1');
    });
});

describe('clinic domain', () => {
    it('treats the flagged, personal or pointed-to workspace as default', () => {
        expect(new Clinic({ id: 'c-1', isDefault: true }).isDefaultWorkspace()).toBe(true);
        expect(new Clinic({ id: 'c-1', type: 'personal' }).isDefaultWorkspace()).toBe(true);
        expect(new Clinic({ id: 'c-1', type: 'organization' }).isDefaultWorkspace({ defaultClinicId: 'c-1' })).toBe(true);
        expect(new Clinic({ id: 'c-2', type: 'organization' }).isDefaultWorkspace({ defaultClinicId: 'c-1' })).toBe(false);
    });

    it('lets only active owners and admins manage a workspace', () => {
        expect(new ClinicMembership({ status: 'active', role: 'owner' }).canManage()).toBe(true);
        expect(new ClinicMembership({ status: 'active', role: 'admin' }).canManage()).toBe(true);
        expect(new ClinicMembership({ status: 'active', role: 'member' }).canManage()).toBe(false);
        expect(new ClinicMembership({ status: 'invited', role: 'owner' }).canManage()).toBe(false);
    });

    it('builds a readable display id', () => {
        expect(Clinic.displayIdFor('City Dental')).toMatch(/^CIT-[A-F0-9]{6}$/);
        expect(Clinic.fallbackDisplayId('clinic-abcdef123456')).toBe('ORG-123456');
    });
});

describe('patient chart', () => {
    it('assembles metadata, history and treatment plan from the stored records', () => {
        const chart = PatientChart.fromRecords([
            { SK: 'METADATA#', id: 'p-1', name: 'John Doe' },
            { SK: 'HISTORY#', items: [{ id: 'h-1' }] },
            { SK: 'PLAN#', items: [{ id: 'plan-1' }] },
        ]);

        expect(chart.exists).toBe(true);
        expect(chart.toFullRecord()).toEqual({
            SK: 'METADATA#',
            id: 'p-1',
            name: 'John Doe',
            treatmentPlan: { items: [{ id: 'plan-1' }] },
            history: { completedItems: [{ id: 'h-1' }] },
        });
    });

    it('reports a missing patient instead of inventing an empty chart', () => {
        expect(PatientChart.fromRecords([]).exists).toBe(false);
    });
});

describe('error mapping', () => {
    it('keeps the status and message of an application error', () => {
        expect(toHttpError(new NotFoundError('Patient not found'))).toEqual({
            statusCode: 404,
            body: { error: 'Patient not found' },
        });
    });

    it('includes structured metadata such as a refresh-token reason', () => {
        const mapped = toHttpError(new UnauthorizedError('Invalid or expired refresh token', {
            meta: { reason: 'reused' },
        }));

        expect(mapped.body).toEqual({ error: 'Invalid or expired refresh token', reason: 'reused' });
    });
});
