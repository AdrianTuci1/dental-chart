const { createGoogleIdTokenClient } = require('./googleIdTokenVerifier');
const {
    BadRequestError,
    ServiceUnavailableError,
    UnauthorizedError,
} = require('../../../shared/errors/AppError');

/**
 * Verifies Google ID tokens issued to the browser by Google Identity Services.
 * The token is checked against Google's JWKS, and only the claims we rely on
 * are handed back to the caller.
 */
class GoogleAuthService {
    constructor() {
        this.clientId = process.env.GOOGLE_CLIENT_ID;
        this.client = this.clientId ? createGoogleIdTokenClient() : null;
    }

    isEnabled() {
        return Boolean(this.clientId && this.client);
    }

    /**
     * @returns {Promise<{ id: string, email: string, emailVerified: boolean, name: string, picture: string }>}
     */
    async verifyIdToken(idToken) {
        if (!this.isEnabled()) {
            throw new ServiceUnavailableError('Google sign-in is not configured on this server');
        }

        if (!idToken) {
            throw new BadRequestError('idToken is required');
        }

        let payload;
        try {
            const ticket = await this.client.verifyIdToken({ idToken, audience: this.clientId });
            payload = ticket.getPayload();
        } catch (error) {
            throw new UnauthorizedError('Google rejected the sign-in token');
        }

        if (!payload?.sub || !payload?.email) {
            throw new UnauthorizedError('Google token is missing the email claim');
        }

        return {
            id: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified === true,
            name: payload.name || payload.given_name || '',
            picture: payload.picture || null,
        };
    }
}

module.exports = GoogleAuthService;
