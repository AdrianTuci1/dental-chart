const { OAuth2Client } = require('google-auth-library');
const { createHttpError } = require('../utils/httpError');

/**
 * Verifies Google ID tokens issued to the browser by Google Identity Services.
 * The token is checked against Google's JWKS offline, and only the claims we rely on
 * are handed back to the caller.
 */
class GoogleAuthService {
    constructor() {
        this.clientId = process.env.GOOGLE_CLIENT_ID;
        this.client = this.clientId ? new OAuth2Client() : null;
    }

    isEnabled() {
        return Boolean(this.clientId && this.client);
    }

    /**
     * @returns {Promise<{ id: string, email: string, emailVerified: boolean, name: string, picture: string }>}
     */
    async verifyIdToken(idToken) {
        if (!this.isEnabled()) {
            throw createHttpError('Google sign-in is not configured on this server', 503);
        }

        if (!idToken) {
            throw createHttpError('idToken is required', 400);
        }

        let payload;
        try {
            const ticket = await this.client.verifyIdToken({ idToken, audience: this.clientId });
            payload = ticket.getPayload();
        } catch (error) {
            throw createHttpError('Google rejected the sign-in token', 401);
        }

        if (!payload?.sub || !payload?.email) {
            throw createHttpError('Google token is missing the email claim', 401);
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
