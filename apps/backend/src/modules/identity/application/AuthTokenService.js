const jwt = require('jsonwebtoken');

const DEFAULT_SECRET = 'dev-only-insecure-jwt-secret';
const DEFAULT_EXPIRES_IN = '15m';

/**
 * Access tokens stay stateless on purpose: every replica can verify one with the shared
 * JWT_SECRET, so nothing has to be replicated. Refresh tokens are opaque and therefore
 * live in DynamoDB (see SessionService).
 */
class AuthTokenService {
    constructor({
        secret = process.env.JWT_SECRET || DEFAULT_SECRET,
        expiresIn = process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN,
    } = {}) {
        this.secret = secret;
        this.expiresIn = expiresIn;
    }

    sign(medic) {
        return jwt.sign(
            {
                sub: medic.id,
                email: medic.email,
                type: 'auth',
            },
            this.secret,
            { expiresIn: this.expiresIn }
        );
    }

    verify(token) {
        return jwt.verify(token, this.secret);
    }

    medicIdFromAuthHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        try {
            const payload = this.verify(authHeader.split(' ')[1]);
            return payload.sub || null;
        } catch {
            return null;
        }
    }

    medicIdFromRequest(req) {
        return req?.auth?.userId || this.medicIdFromAuthHeader(req?.headers?.authorization);
    }

    /** Middleware result for a valid Bearer token, or null. */
    authenticate(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.split(' ')[1];

        try {
            const payload = this.verify(token);
            return { token, userId: payload.sub, email: payload.email, payload };
        } catch {
            return null;
        }
    }
}

const authTokenService = new AuthTokenService();

module.exports = {
    AuthTokenService,
    authTokenService,
    // Convenience exports for modules that only need the shared instance.
    signAuthToken: (medic) => authTokenService.sign(medic),
    verifyAuthToken: (token) => authTokenService.verify(token),
    extractMedicIdFromAuthHeader: (header) => authTokenService.medicIdFromAuthHeader(header),
    extractMedicIdFromRequest: (req) => authTokenService.medicIdFromRequest(req),
};
