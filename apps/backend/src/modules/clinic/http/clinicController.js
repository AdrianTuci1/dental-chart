const { asyncHandler } = require('../../../shared/http/asyncHandler');
const { UnauthorizedError } = require('../../../shared/errors/AppError');
const { authTokenService } = require('../../identity/application/AuthTokenService');

/** HTTP adapter for the clinic module: workspaces, members and invitations. */
const createClinicController = ({
    clinicService,
    tokenService = authTokenService,
}) => ({
    createClinic: asyncHandler(async (req, res) => {
        const requesterMedicId = tokenService.medicIdFromRequest(req);
        if (!requesterMedicId) {
            throw new UnauthorizedError('Invalid or expired token');
        }

        const clinic = await clinicService.createSharedClinic({
            ...(req.body || {}),
            ownerMedicId: requesterMedicId,
        });

        res.status(201).json(clinic);
    }),

    getClinic: asyncHandler(async (req, res) => {
        const clinic = await clinicService.getClinic(req.params.id, tokenService.medicIdFromRequest(req));

        if (!clinic) {
            return res.status(404).json({ error: 'Clinic not found' });
        }

        return res.json(clinic);
    }),

    listMedicClinics: asyncHandler(async (req, res) => {
        res.json(await clinicService.listMedicClinics(req.params.id));
    }),

    listPendingInvitations: asyncHandler(async (req, res) => {
        const requesterMedicId = tokenService.medicIdFromRequest(req);
        res.json(await clinicService.listPendingInvitationsForMedic(requesterMedicId));
    }),

    getClinicMembers: asyncHandler(async (req, res) => {
        const requesterMedicId = tokenService.medicIdFromRequest(req);
        res.json(await clinicService.getClinicMembers(req.params.id, requesterMedicId));
    }),

    updateClinic: asyncHandler(async (req, res) => {
        const requesterMedicId = tokenService.medicIdFromRequest(req);
        res.json(await clinicService.updateClinic(req.params.id, req.body, requesterMedicId));
    }),

    inviteMedic: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const requesterMedicId = tokenService.medicIdFromRequest(req);
        const invitation = await clinicService.inviteMedic(id, req.body, requesterMedicId);

        res.status(201).json(invitation);

        if (invitation?.id) {
            Promise.resolve(clinicService.sendInvitationEmail({
                clinicId: id,
                invitationId: invitation.id,
                inviterMedicId: requesterMedicId,
            })).catch((error) => console.error('[ClinicController] Email error:', error.message));
        }
    }),

    acceptInvitation: asyncHandler(async (req, res) => {
        const { id, inviteId } = req.params;
        const medicId = tokenService.medicIdFromRequest(req);
        res.json(await clinicService.acceptInvitation(id, inviteId, medicId));
    }),

    removeMember: asyncHandler(async (req, res) => {
        const { id, medicId } = req.params;
        const requesterMedicId = tokenService.medicIdFromRequest(req);
        res.json(await clinicService.removeMember(id, medicId, requesterMedicId));
    }),

    transferOwnership: asyncHandler(async (req, res) => {
        const requesterMedicId = tokenService.medicIdFromRequest(req);
        res.json(await clinicService.transferOwnership(req.params.id, req.body?.newOwnerMedicId, requesterMedicId));
    }),

    deleteClinic: asyncHandler(async (req, res) => {
        const requesterMedicId = tokenService.medicIdFromRequest(req);
        res.json(await clinicService.deleteClinic(req.params.id, requesterMedicId));
    }),
});

module.exports = createClinicController;
