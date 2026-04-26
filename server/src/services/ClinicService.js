const ClinicRepository = require('../models/repositories/ClinicRepository');
const MedicRepository = require('../models/repositories/MedicRepository');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { createHttpError } = require('../utils/httpError');

class ClinicService {
    constructor() {
        this.clinicRepository = new ClinicRepository();
        this.medicRepository = new MedicRepository();
    }

    async createClinic(clinicData) {
        if (!clinicData.name) {
            throw createHttpError('Clinic name is required', 400);
        }

        if (!clinicData.ownerMedicId) {
            throw createHttpError('ownerMedicId is required to create a clinic', 400);
        }

        const owner = await this.medicRepository.getMedicById(clinicData.ownerMedicId);
        if (!owner) {
            throw createHttpError('Owner medic not found', 404);
        }

        const id = clinicData.id || uuidv4();
        const dataToSave = {
            id,
            displayId: clinicData.displayId || this.buildClinicDisplayId(clinicData.name),
            type: clinicData.type || 'organization',
            ...clinicData,
        };

        await this.clinicRepository.createClinic(dataToSave);
        await this.clinicRepository.upsertClinicMember(id, {
            medicId: owner.id,
            name: owner.name,
            email: owner.email,
            role: 'owner',
            status: 'active',
            joinedAt: new Date().toISOString(),
        });

        return this.getClinic(id, owner.id);
    }

    async getClinic(id, requesterMedicId = null) {
        const clinic = await this.clinicRepository.getClinicById(id);
        if (!clinic) {
            return null;
        }

        if (requesterMedicId) {
            const membership = await this.clinicRepository.getClinicMember(id, requesterMedicId);
            if (!membership || membership.status !== 'active') {
                throw createHttpError('Medic does not have access to this clinic', 403);
            }
        }

        const [members, invitations] = await Promise.all([
            this.clinicRepository.listClinicMembers(id),
            this.clinicRepository.listClinicInvitations(id),
        ]);

        const owner = clinic.ownerMedicId
            ? await this.medicRepository.getMedicById(clinic.ownerMedicId)
            : null;

        return {
            ...clinic,
            displayId: clinic.displayId || this.buildFallbackClinicDisplayId(clinic.id),
            ownerName: owner?.name || null,
            ownerEmail: owner?.email || null,
            members,
            invitations,
        };
    }

    async getClinicMembers(clinicId, requesterMedicId = null) {
        if (requesterMedicId) {
            const membership = await this.clinicRepository.getClinicMember(clinicId, requesterMedicId);
            if (!membership || membership.status !== 'active') {
                throw createHttpError('Medic does not have access to this clinic', 403);
            }
        }

        return this.clinicRepository.listClinicMembers(clinicId);
    }

    async listMedicClinics(medicId) {
        if (!medicId) {
            throw createHttpError('Medic ID is required', 400);
        }

        const memberships = await this.clinicRepository.listClinicsByMedicId(medicId);
        const clinics = await Promise.all(
            memberships.map(async (membership) => {
                const clinic = await this.clinicRepository.getClinicById(membership.clinicId);
                if (!clinic) {
                    return null;
                }

                const [members, invitations, owner] = await Promise.all([
                    this.clinicRepository.listClinicMembers(membership.clinicId),
                    this.clinicRepository.listClinicInvitations(membership.clinicId),
                    clinic.ownerMedicId ? this.medicRepository.getMedicById(clinic.ownerMedicId) : Promise.resolve(null),
                ]);

                return {
                    ...clinic,
                    displayId: clinic.displayId || this.buildFallbackClinicDisplayId(clinic.id),
                    ownerName: owner?.name || null,
                    ownerEmail: owner?.email || null,
                    members,
                    invitations,
                    membership: {
                        role: membership.role,
                        status: membership.status,
                        joinedAt: membership.joinedAt,
                    },
                };
            })
        );

        return clinics.filter(Boolean);
    }

    async listOwnedClinics(medicId) {
        return this.clinicRepository.listOwnedClinicsByMedicId(medicId);
    }

    async listPendingInvitationsForMedic(medicId) {
        const medic = await this.medicRepository.getMedicById(medicId);
        if (!medic?.email) {
            return [];
        }

        const invitations = await this.clinicRepository.listPendingInvitationsByEmail(medic.email);
        const pendingInvitations = await Promise.all(
            invitations.map(async (invitation) => {
                const clinic = await this.clinicRepository.getClinicById(invitation.clinicId);
                if (!clinic) {
                    return null;
                }

                return {
                    ...invitation,
                    clinicName: clinic.name,
                    clinicDisplayId: clinic.displayId || this.buildFallbackClinicDisplayId(clinic.id),
                    clinicType: clinic.type,
                };
            })
        );

        return pendingInvitations.filter(Boolean);
    }

    async resolveClinicForMedic(medicId, preferredClinicId = null) {
        const clinics = await this.listMedicClinics(medicId);
        if (!clinics.length) {
            throw createHttpError('Medic does not belong to any clinic', 400);
        }

        if (preferredClinicId) {
            const preferred = clinics.find((clinic) => clinic.id === preferredClinicId);
            if (!preferred) {
                throw createHttpError('Medic does not have access to the selected clinic', 403);
            }

            return preferred;
        }

        const medic = await this.medicRepository.getMedicById(medicId);
        if (medic?.defaultClinicId) {
            const defaultClinic = clinics.find((clinic) => clinic.id === medic.defaultClinicId);
            if (defaultClinic) {
                return defaultClinic;
            }
        }

        return clinics[0];
    }

    async updateClinic(clinicId, updateData, requesterMedicId) {
        if (!requesterMedicId) {
            throw createHttpError('requesterMedicId is required', 401);
        }

        const [clinic, membership] = await Promise.all([
            this.clinicRepository.getClinicById(clinicId),
            this.clinicRepository.getClinicMember(clinicId, requesterMedicId),
        ]);

        if (!clinic) {
            throw createHttpError('Clinic not found', 404);
        }

        if (!membership || membership.status !== 'active') {
            throw createHttpError('Medic does not have access to this clinic', 403);
        }

        if (!['owner', 'admin'].includes(membership.role)) {
            throw createHttpError('Only owners or admins can update clinic details', 403);
        }

        const nextName = updateData?.name?.trim();
        if (!nextName) {
            throw createHttpError('Clinic name is required', 400);
        }

        await this.clinicRepository.updateClinic(clinicId, {
            ...clinic,
            name: nextName,
            displayId: clinic.displayId || this.buildFallbackClinicDisplayId(clinicId),
        });

        return this.getClinic(clinicId, requesterMedicId);
    }

    async inviteMedic(clinicId, inviteData, requesterMedicId = null) {
        if (!inviteData.invitedEmail) {
            throw createHttpError('invitedEmail is required', 400);
        }

        const clinic = await this.clinicRepository.getClinicById(clinicId);
        if (!clinic) {
            throw createHttpError('Clinic not found', 404);
        }

        if (requesterMedicId) {
            const membership = await this.clinicRepository.getClinicMember(clinicId, requesterMedicId);
            if (!membership || membership.status !== 'active') {
                throw createHttpError('Medic does not have access to this clinic', 403);
            }

            if (!['owner', 'admin'].includes(membership.role)) {
                throw createHttpError('Only owners or admins can invite clinic members', 403);
            }
        }

        const existingMedic = await this.medicRepository.getMedicByEmail(inviteData.invitedEmail);
        if (existingMedic) {
            const membership = await this.clinicRepository.getClinicMember(clinicId, existingMedic.id);
            if (membership?.status === 'active') {
                throw createHttpError('Medic is already a member of this clinic', 409);
            }
        }

        const existingInvitations = await this.clinicRepository.listClinicInvitations(clinicId);
        const hasPendingInvitation = existingInvitations.some(
            (invitation) => invitation.invitedEmail === inviteData.invitedEmail && invitation.status === 'pending'
        );
        if (hasPendingInvitation) {
            throw createHttpError('There is already a pending invitation for this email', 409);
        }

        const invitation = {
            id: inviteData.id || uuidv4(),
            clinicId,
            invitedEmail: inviteData.invitedEmail,
            invitedByMedicId: inviteData.invitedByMedicId,
            medicId: existingMedic?.id || null,
            role: inviteData.role || 'member',
            status: 'pending',
        };

        return this.clinicRepository.createInvitation(clinicId, invitation);
    }

    async acceptInvitation(clinicId, inviteId, medicId) {
        const [invitation, clinic, medic] = await Promise.all([
            this.clinicRepository.getInvitation(clinicId, inviteId),
            this.clinicRepository.getClinicById(clinicId),
            this.medicRepository.getMedicById(medicId),
        ]);

        if (!clinic) {
            throw createHttpError('Clinic not found', 404);
        }
        if (!invitation) {
            throw createHttpError('Invitation not found', 404);
        }
        if (!medic) {
            throw createHttpError('Medic not found', 404);
        }
        if (invitation.status === 'accepted') {
            throw createHttpError('Invitation has already been accepted', 409);
        }
        if (invitation.invitedEmail !== medic.email) {
            throw createHttpError('Invitation does not belong to this medic', 403);
        }

        await this.clinicRepository.upsertClinicMember(clinicId, {
            medicId,
            name: medic.name,
            email: medic.email,
            role: invitation.role || 'member',
            status: 'active',
            joinedAt: new Date().toISOString(),
        });

        await this.clinicRepository.updateInvitation(clinicId, inviteId, {
            ...invitation,
            medicId,
            status: 'accepted',
            acceptedAt: new Date().toISOString(),
        });

        return this.getClinic(clinicId, medicId);
    }

    async removeMember(clinicId, targetMedicId, requesterMedicId) {
        if (!requesterMedicId) {
            throw createHttpError('requesterMedicId is required', 401);
        }

        const clinic = await this.clinicRepository.getClinicById(clinicId);
        if (!clinic) {
            throw createHttpError('Clinic not found', 404);
        }

        const [requesterMembership, targetMembership] = await Promise.all([
            this.clinicRepository.getClinicMember(clinicId, requesterMedicId),
            this.clinicRepository.getClinicMember(clinicId, targetMedicId),
        ]);

        if (!requesterMembership || requesterMembership.status !== 'active') {
            throw createHttpError('Medic does not have access to this clinic', 403);
        }

        if (!targetMembership) {
            throw createHttpError('Clinic member not found', 404);
        }

        const canManageMembers = ['owner', 'admin'].includes(requesterMembership.role);
        const isSelfRemoval = String(requesterMedicId) === String(targetMedicId);

        if (!canManageMembers && !isSelfRemoval) {
            throw createHttpError('Only owners or admins can remove clinic members', 403);
        }

        if (targetMembership.role === 'owner') {
            throw createHttpError('Transfer ownership before removing the clinic owner', 409);
        }

        await this.clinicRepository.deleteClinicMember(clinicId, targetMedicId);
        return this.getClinic(clinicId, requesterMedicId);
    }

    async transferOwnership(clinicId, newOwnerMedicId, requesterMedicId = null) {
        if (!newOwnerMedicId) {
            throw createHttpError('newOwnerMedicId is required', 400);
        }

        const clinic = await this.clinicRepository.getClinicById(clinicId);
        if (!clinic) {
            throw createHttpError('Clinic not found', 404);
        }

        if (requesterMedicId && String(clinic.ownerMedicId) !== String(requesterMedicId)) {
            throw createHttpError('Only the clinic owner can transfer ownership', 403);
        }

        const [currentOwner, nextOwnerMembership, nextOwnerMedic] = await Promise.all([
            this.clinicRepository.getClinicMember(clinicId, clinic.ownerMedicId),
            this.clinicRepository.getClinicMember(clinicId, newOwnerMedicId),
            this.medicRepository.getMedicById(newOwnerMedicId),
        ]);

        if (!nextOwnerMedic) {
            throw createHttpError('New owner medic not found', 404);
        }

        if (!nextOwnerMembership || nextOwnerMembership.status !== 'active') {
            throw createHttpError('New owner must already be an active clinic member', 400);
        }

        await this.clinicRepository.updateClinic(clinicId, {
            ...clinic,
            ownerMedicId: newOwnerMedicId,
            ownerRole: 'owner',
        });

        if (currentOwner) {
            await this.clinicRepository.upsertClinicMember(clinicId, {
                ...currentOwner,
                role: 'admin',
                status: 'active',
            });
        }

        await this.clinicRepository.upsertClinicMember(clinicId, {
            ...nextOwnerMembership,
            medicId: newOwnerMedicId,
            name: nextOwnerMedic.name,
            email: nextOwnerMedic.email,
            role: 'owner',
            status: 'active',
        });

        return this.getClinic(clinicId, newOwnerMedicId);
    }

    async removeMedicFromClinic(clinicId, medicId) {
        const membership = await this.clinicRepository.getClinicMember(clinicId, medicId);
        if (!membership) {
            return;
        }

        await this.clinicRepository.deleteClinicMember(clinicId, medicId);
        const remainingMembers = await this.clinicRepository.listClinicMembers(clinicId);

        if (!remainingMembers.length) {
            await this.clinicRepository.deleteClinic(clinicId);
        }
    }

    async deleteClinic(clinicId, requesterMedicId) {
        if (!requesterMedicId) {
            throw createHttpError('requesterMedicId is required', 401);
        }

        const [clinic, membership] = await Promise.all([
            this.clinicRepository.getClinicById(clinicId),
            this.clinicRepository.getClinicMember(clinicId, requesterMedicId),
        ]);

        if (!clinic) {
            throw createHttpError('Clinic not found', 404);
        }

        if (!membership || membership.status !== 'active') {
            throw createHttpError('Medic does not have access to this clinic', 403);
        }

        if (!['owner', 'admin'].includes(membership.role)) {
            throw createHttpError('Only owners or admins can delete a clinic', 403);
        }

        const PatientService = require('./PatientService');
        const patientService = new PatientService();
        await patientService.deletePatientsByClinicId(clinicId);
        await this.clinicRepository.deleteClinic(clinicId);

        return {
            deleted: true,
            clinicId,
        };
    }

    buildClinicDisplayId(name) {
        const prefix = String(name || 'ORG')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 3)
            .padEnd(3, 'X');
        const suffix = crypto.randomBytes(3).toString('hex').slice(0, 6).toUpperCase();
        return `${prefix}-${suffix}`;
    }

    buildFallbackClinicDisplayId(id) {
        const suffix = String(id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || 'XXXXXX';
        return `ORG-${suffix}`;
    }
}

module.exports = ClinicService;
