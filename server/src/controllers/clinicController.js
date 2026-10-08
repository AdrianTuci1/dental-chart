const ClinicService = require('../services/ClinicService');
const { extractMedicIdFromRequest } = require('../utils/auth');

const clinicService = new ClinicService();

exports.createClinic = async (req, res) => {
    try {
        const requesterMedicId = extractMedicIdFromRequest(req);
        if (!requesterMedicId) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // These keys are server-owned: a caller can only ever create an additional
        // shared workspace that it owns itself.
        const protectedKeys = new Set(['ownerMedicId', 'type', 'isDefault', 'id', 'displayId', 'PK', 'SK']);
        const { name, ...submittedFields } = req.body || {};
        const clinicFields = Object.fromEntries(
            Object.entries(submittedFields).filter(([key]) => !protectedKeys.has(key))
        );

        const newClinic = await clinicService.createSharedClinic({
            ...clinicFields,
            name,
            ownerMedicId: requesterMedicId,
        });
        res.status(201).json(newClinic);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.getClinic = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterMedicId = extractMedicIdFromRequest(req);
        const clinic = await clinicService.getClinic(id, requesterMedicId);

        if (!clinic) {
            return res.status(404).json({ error: 'Clinic not found' });
        }
        res.json(clinic);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.listMedicClinics = async (req, res) => {
    try {
        const { id } = req.params;
        const clinics = await clinicService.listMedicClinics(id);
        res.json(clinics);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.listPendingInvitations = async (req, res) => {
    try {
        const requesterMedicId = extractMedicIdFromRequest(req);
        const invitations = await clinicService.listPendingInvitationsForMedic(requesterMedicId);
        res.json(invitations);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.getClinicMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterMedicId = extractMedicIdFromRequest(req);
        const members = await clinicService.getClinicMembers(id, requesterMedicId);
        res.json(members);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.updateClinic = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterMedicId = extractMedicIdFromRequest(req);
        const clinic = await clinicService.updateClinic(id, req.body, requesterMedicId);
        res.json(clinic);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.inviteMedic = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterMedicId = extractMedicIdFromRequest(req);
        const invitation = await clinicService.inviteMedic(id, req.body, requesterMedicId);
        res.status(201).json(invitation);

        if (invitation?.id) {
            Promise.resolve(clinicService.sendInvitationEmail({
                clinicId: id,
                invitationId: invitation.id,
                inviterMedicId: requesterMedicId,
            })).catch((err) => console.error('[ClinicController inviteMedic] Email error:', err.message));
        }
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.acceptInvitation = async (req, res) => {
    try {
        const { id, inviteId } = req.params;
        const medicId = extractMedicIdFromRequest(req);
        const clinic = await clinicService.acceptInvitation(id, inviteId, medicId);
        res.json(clinic);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.removeMember = async (req, res) => {
    try {
        const { id, medicId } = req.params;
        const requesterMedicId = extractMedicIdFromRequest(req);
        const clinic = await clinicService.removeMember(id, medicId, requesterMedicId);
        res.json(clinic);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.transferOwnership = async (req, res) => {
    try {
        const { id } = req.params;
        const { newOwnerMedicId } = req.body;
        const requesterMedicId = extractMedicIdFromRequest(req);
        const clinic = await clinicService.transferOwnership(id, newOwnerMedicId, requesterMedicId);
        res.json(clinic);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.deleteClinic = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterMedicId = extractMedicIdFromRequest(req);
        const result = await clinicService.deleteClinic(id, requesterMedicId);
        res.json(result);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};
