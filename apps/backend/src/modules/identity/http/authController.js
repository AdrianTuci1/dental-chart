const { asyncHandler } = require('../../../shared/http/asyncHandler');
const { UnauthorizedError } = require('../../../shared/errors/AppError');
const { authTokenService } = require('../application/AuthTokenService');

/**
 * HTTP adapter for the identity module. It moves request data into AuthService and the
 * result back out; status codes and side effects after the response live here.
 */
const createAuthController = ({
    authService,
    medicService,
    tokenService = authTokenService,
}) => {
    const sendWelcomeEmailAfterResponse = (medic) => {
        if (!medic) return;

        Promise.resolve(medicService.sendWelcomeEmail(medic)).catch((error) => {
            console.error('[AuthController] Welcome email error:', error.message);
        });
    };

    return {
        register: asyncHandler(async (req, res) => {
            const result = await authService.register(req.body);
            res.status(result.statusCode).json(result.body);
            sendWelcomeEmailAfterResponse(result.welcomeMedic);
        }),

        login: asyncHandler(async (req, res) => {
            const result = await authService.login(req.body);
            res.status(result.statusCode).json(result.body);
        }),

        googleLogin: asyncHandler(async (req, res) => {
            const result = await authService.googleLogin(req.body);
            res.status(result.statusCode).json(result.body);
            sendWelcomeEmailAfterResponse(result.welcomeMedic);
        }),

        getMe: asyncHandler(async (req, res) => {
            const medicId = tokenService.medicIdFromRequest(req);
            res.json(await authService.getMe(medicId));
        }),

        forgotPassword: asyncHandler(async (req, res) => {
            res.json(await authService.forgotPassword(req.body?.email));
        }),

        resetPassword: asyncHandler(async (req, res) => {
            res.json(await authService.resetPassword(req.body));
        }),

        changePassword: asyncHandler(async (req, res) => {
            const medicId = tokenService.medicIdFromRequest(req);
            if (!medicId) {
                throw new UnauthorizedError('Invalid or expired token');
            }

            res.json(await authService.changePassword({
                medicId,
                currentPassword: req.body?.currentPassword,
                newPassword: req.body?.newPassword,
            }));
        }),

        refresh: asyncHandler(async (req, res) => {
            const result = await authService.refresh(req.body?.refreshToken);
            res.status(result.statusCode).json(result.body);
        }),

        logout: asyncHandler(async (req, res) => {
            res.json(await authService.logout(req.body?.refreshToken));
        }),
    };
};

module.exports = createAuthController;
