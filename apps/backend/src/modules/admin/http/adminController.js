const { asyncHandler } = require('../../../shared/http/asyncHandler');

/** HTTP adapter for the platform-admin module. Authorization runs in the middleware. */
const createAdminController = ({ adminService }) => ({
    listAccounts: asyncHandler(async (req, res) => {
        res.json(await adminService.listAccounts({
            search: req.query?.search,
            status: req.query?.status,
        }));
    }),

    getAccount: asyncHandler(async (req, res) => {
        res.json(await adminService.getAccount(req.params.id));
    }),

    updateAccount: asyncHandler(async (req, res) => {
        const updated = await adminService.setAccountStatus(
            req.params.id,
            req.body?.status,
            req.auth?.userId
        );

        res.json(updated);
    }),

    deleteAccount: asyncHandler(async (req, res) => {
        await adminService.deleteAccount(req.params.id, req.auth?.userId);
        res.status(204).end();
    }),
});

module.exports = createAdminController;
