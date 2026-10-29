const { UnauthorizedError } = require('../../../shared/errors/AppError');

/**
 * Resolves the account behind the integration API key. The public API accepts the key in
 * `Authorization: ApiKey`, `Authorization: Bearer` or `X-Api-Key`, matching the existing
 * integration contract.
 */
class ApiKeyAuthenticator {
    constructor({ medicService }) {
        this.medicService = medicService;
    }

    static keyFromRequest(req) {
        const bearerHeader = req.headers.authorization;

        if (bearerHeader?.startsWith('ApiKey ')) {
            return bearerHeader.slice('ApiKey '.length);
        }

        if (bearerHeader?.startsWith('Bearer ')) {
            return bearerHeader.slice('Bearer '.length);
        }

        return req.headers['x-api-key'];
    }

    async authenticate(req) {
        const apiKey = ApiKeyAuthenticator.keyFromRequest(req);

        if (!apiKey) {
            throw new UnauthorizedError('Missing API key');
        }

        const medic = await this.medicService.getMedicByApiKey(apiKey);
        if (!medic) {
            throw new UnauthorizedError('Invalid API key');
        }

        return medic;
    }
}

module.exports = ApiKeyAuthenticator;
