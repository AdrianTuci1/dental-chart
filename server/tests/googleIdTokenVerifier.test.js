const { createSign, generateKeyPairSync } = require('crypto');
const { createGoogleIdTokenClient, resetKeyCache } = require('../src/services/googleIdTokenVerifier');

const AUDIENCE = 'client-id.apps.googleusercontent.com';
const KID = 'test-signing-key';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });

const buildJwk = () => {
    const jwk = publicKey.export({ format: 'jwk' });
    return { ...jwk, kid: KID, alg: 'RS256', use: 'sig' };
};

const encodeSegment = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

const signToken = (payload, { header = { alg: 'RS256', kid: KID, typ: 'JWT' }, sign = true } = {}) => {
    const signingInput = `${encodeSegment(header)}.${encodeSegment(payload)}`;
    const signature = sign
        ? createSign('RSA-SHA256').update(signingInput).sign(privateKey).toString('base64url')
        : 'not-a-real-signature';

    return `${signingInput}.${signature}`;
};

const futureExp = () => Math.floor(Date.now() / 1000) + 300;

describe('googleIdTokenVerifier', () => {
    let fetchMock;

    const validClaims = (overrides = {}) => ({
        iss: 'https://accounts.google.com',
        aud: AUDIENCE,
        sub: 'g-1',
        email: 'dana@clinic.test',
        email_verified: true,
        name: 'Dana Vale',
        exp: futureExp(),
        ...overrides,
    });

    beforeEach(() => {
        resetKeyCache();
        fetchMock = jest.fn(async () => ({
            ok: true,
            status: 200,
            headers: { get: () => 'max-age=3600' },
            json: async () => ({ keys: [buildJwk()] }),
        }));
        global.fetch = fetchMock;
    });

    it('accepts a token signed by the published key', async () => {
        const ticket = await createGoogleIdTokenClient()
            .verifyIdToken({ idToken: signToken(validClaims()), audience: AUDIENCE });

        expect(ticket.getPayload().sub).toBe('g-1');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('serves repeated verifications from the JWKS cache', async () => {
        const client = createGoogleIdTokenClient();

        await client.verifyIdToken({ idToken: signToken(validClaims()), audience: AUDIENCE });
        await client.verifyIdToken({ idToken: signToken(validClaims()), audience: AUDIENCE });

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('rejects a token whose payload was changed after signing', async () => {
        const [header, , signature] = signToken(validClaims()).split('.');
        const tampered = `${header}.${encodeSegment(validClaims({ sub: 'someone-else' }))}.${signature}`;

        await expect(createGoogleIdTokenClient().verifyIdToken({ idToken: tampered, audience: AUDIENCE }))
            .rejects.toThrow('Signature does not match');
    });

    it('rejects an expired token', async () => {
        const expired = validClaims({ exp: Math.floor(Date.now() / 1000) - 3600 });

        await expect(createGoogleIdTokenClient().verifyIdToken({ idToken: signToken(expired), audience: AUDIENCE }))
            .rejects.toThrow('Token expired');
    });

    it('rejects a token minted for another client', async () => {
        const otherClient = validClaims({ aud: 'someone-else.apps.googleusercontent.com' });

        await expect(createGoogleIdTokenClient().verifyIdToken({ idToken: signToken(otherClient), audience: AUDIENCE }))
            .rejects.toThrow('Token was issued for another client');
    });

    it('rejects an unsigned token instead of trusting its claims', async () => {
        const unsigned = signToken(validClaims(), { header: { alg: 'none', kid: KID }, sign: false });

        await expect(createGoogleIdTokenClient().verifyIdToken({ idToken: unsigned, audience: AUDIENCE }))
            .rejects.toThrow('Unsupported algorithm: none');
    });

    it('rejects an unexpected issuer', async () => {
        const wrongIssuer = validClaims({ iss: 'https://evil.test' });

        await expect(createGoogleIdTokenClient().verifyIdToken({ idToken: signToken(wrongIssuer), audience: AUDIENCE }))
            .rejects.toThrow('Unexpected issuer');
    });
});
