process.env.CORS_ORIGIN = 'https://admin.example.com';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.DYNAMODB_TABLE_NAME = 'DentalChart';
process.env.AWS_REGION = 'eu-central-1';

const { handle } = require('../src/http/workerApp');

const preflight = (origin) => new Request('https://api.example.com/api/admin/accounts', {
    method: 'OPTIONS',
    headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'PATCH',
    },
});

describe('Worker CORS', () => {
    it('answers preflight for an allowed admin origin', async () => {
        const response = await handle(preflight('https://admin.example.com'), {});

        expect(response.status).toBe(204);
        expect(response.headers.get('access-control-allow-origin')).toBe('https://admin.example.com');
        expect(response.headers.get('access-control-allow-methods')).toContain('PATCH');
        expect(response.headers.get('access-control-allow-headers')).toContain('Authorization');
        expect(response.headers.get('vary')).toContain('Origin');
    });

    it('leaves an unknown origin without CORS headers', async () => {
        const response = await handle(preflight('https://evil.example.com'), {});

        expect(response.headers.get('access-control-allow-origin')).toBeNull();
    });

    it('adds the origin header to a normal API response', async () => {
        const request = new Request('https://api.example.com/api/admin/accounts', {
            headers: { Origin: 'https://admin.example.com' },
        });
        const response = await handle(request, {});

        expect(response.status).toBe(401);
        expect(response.headers.get('access-control-allow-origin')).toBe('https://admin.example.com');
    });
});
