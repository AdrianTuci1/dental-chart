const { authTokenService } = require('../application/AuthTokenService');

/**
 * Presentation middleware for the identity module.
 *
 * `requireAuth` only reads the token and puts the claims on the request; authorization
 * decisions stay in the application services.
 */
const createAuthMiddleware = ({ tokenService = authTokenService } = {}) => ({
    requireAuth: (req, res, next) => {
        const header = req.headers.authorization;

        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const actor = tokenService.authenticate(header);

        if (!actor) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.auth = actor;
        return next();
    },

    requireSameMedicParam: (paramName = 'id') => (req, res, next) => {
        const authenticatedMedicId = req?.auth?.userId;
        const targetMedicId = req?.params?.[paramName];

        if (!authenticatedMedicId) {
            return res.status(401).json({ error: 'Unauthorized: No authenticated user' });
        }

        if (!targetMedicId || String(authenticatedMedicId) !== String(targetMedicId)) {
            return res.status(403).json({ error: 'Forbidden: You can only access your own medic resources' });
        }

        return next();
    },
});

module.exports = createAuthMiddleware;
