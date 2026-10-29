/**
 * Authorization middleware for the platform-admin routes. It loads the account on every
 * request because PLATFORM_ADMIN_EMAILS is the source of truth and a disabled account must
 * lose access before its access token expires.
 */
const createAdminMiddleware = ({ adminService }) => ({
    requirePlatformAdmin: async (req, res, next) => {
        try {
            await adminService.assertActor(req.auth?.userId);
            return next();
        } catch (error) {
            return next(error);
        }
    },
});

module.exports = createAdminMiddleware;
