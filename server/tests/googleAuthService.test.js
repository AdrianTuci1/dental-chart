const GoogleAuthService = require('../src/services/GoogleAuthService');

const ticketFor = (payload) => ({ getPayload: () => payload });

const buildService = (verifyImpl) => {
    const service = new GoogleAuthService();
    service.clientId = 'client-id.apps.googleusercontent.com';
    service.client = { verifyIdToken: jest.fn(verifyImpl) };
    return service;
};

describe('GoogleAuthService.verifyIdToken', () => {
    const originalClientId = process.env.GOOGLE_CLIENT_ID;

    afterEach(() => {
        if (originalClientId === undefined) {
            delete process.env.GOOGLE_CLIENT_ID;
        } else {
            process.env.GOOGLE_CLIENT_ID = originalClientId;
        }
    });

    it('refuses to verify anything when GOOGLE_CLIENT_ID is not set', async () => {
        delete process.env.GOOGLE_CLIENT_ID;

        await expect(new GoogleAuthService().verifyIdToken('token')).rejects.toMatchObject({
            statusCode: 503,
            message: 'Google sign-in is not configured on this server',
        });
    });

    it('requires a token from the client', async () => {
        const service = buildService(async () => ticketFor({ sub: '1', email: 'a@b.c' }));

        await expect(service.verifyIdToken('')).rejects.toMatchObject({ statusCode: 400 });
        expect(service.client.verifyIdToken).not.toHaveBeenCalled();
    });

    it('checks the signature against our own client id', async () => {
        const service = buildService(async () => ticketFor({
            sub: 'g-1',
            email: 'dana@clinic.test',
            email_verified: true,
            name: 'Dana Vale',
            picture: 'https://cdn/p.png',
        }));

        const claims = await service.verifyIdToken('google-id-token');

        expect(service.client.verifyIdToken).toHaveBeenCalledWith({
            idToken: 'google-id-token',
            audience: 'client-id.apps.googleusercontent.com',
        });
        expect(claims).toEqual({
            id: 'g-1',
            email: 'dana@clinic.test',
            emailVerified: true,
            name: 'Dana Vale',
            picture: 'https://cdn/p.png',
        });
    });

    it('reports an unverified email instead of hiding it', async () => {
        const service = buildService(async () => ticketFor({ sub: 'g-1', email: 'dana@clinic.test' }));

        const claims = await service.verifyIdToken('google-id-token');

        expect(claims.emailVerified).toBe(false);
    });

    it('leaves the name empty when Google omits it', async () => {
        const service = buildService(async () => ticketFor({ sub: 'g-1', email: 'dana@clinic.test' }));

        const claims = await service.verifyIdToken('google-id-token');

        expect(claims.name).toBe('');
    });

    it('maps a rejected token to a 401 without leaking Google details', async () => {
        const service = buildService(async () => {
            throw new Error('Invalid session state: token expired');
        });

        await expect(service.verifyIdToken('expired-token')).rejects.toMatchObject({
            statusCode: 401,
            message: 'Google rejected the sign-in token',
        });
    });

    it('rejects a token without an email claim', async () => {
        const service = buildService(async () => ticketFor({ sub: 'g-1' }));

        await expect(service.verifyIdToken('token')).rejects.toMatchObject({
            statusCode: 401,
            message: 'Google token is missing the email claim',
        });
    });
});
