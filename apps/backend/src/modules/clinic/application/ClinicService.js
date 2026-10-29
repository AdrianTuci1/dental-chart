const { v4: uuidv4 } = require('uuid');

const ClinicRepository = require('../infrastructure/ClinicRepository');
const EmailService = require('../../email/application/EmailService');
const UserAnalyticsService = require('../../analytics/application/UserAnalyticsService');
const { Clinic, ClinicMembership } = require('../domain/Clinic');
const {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
} = require('../../../shared/errors/AppError');

// A workspace created through the public endpoint can never choose the keys that decide
// ownership, identity or the default flag. Those belong to the server.
const SERVER_OWNED_FIELDS = new Set(['ownerMedicId', 'type', 'isDefault', 'id', 'displayId', 'PK', 'SK']);

/**
 * Workspace application service: clinics, memberships and invitations.
 *
 * Patient cleanup is reached through a narrow `patientDirectory` port because the
 * patients module owns those records; the composition root supplies the implementation.
 */
class ClinicService {
    constructor({
        clinicRepository = new ClinicRepository(),
        medicRepository = null,
        emailService = new EmailService(),
        analyticsService = new UserAnalyticsService(),
        patientDirectory = null,
        idGenerator = uuidv4,
    } = {}) {
        this.clinicRepository = clinicRepository;
        this.medicRepository = medicRepository;
        this.emailService = emailService;
        this.analyticsService = analyticsService;
        this.idGenerator = idGenerator;

        // Direct construction (scripts, tests) still works without the container.
        this.patientDirectory = patientDirectory || {
            deletePatientsByClinicId: (clinicId) => {
                const PatientService = require('../../patients/application/PatientService');
                return new PatientService({ medicRepository: this.medicRepository })
                    .deletePatientsByClinicId(clinicId);
            },
        };
    }

    async createClinic(clinicData) {
        if (!clinicData.name) {
            throw new BadRequestError('Clinic name is required');
        }

        if (!clinicData.ownerMedicId) {
            throw new BadRequestError('ownerMedicId is required to create a clinic');
        }

        const owner = await this.medicRepository.getMedicById(clinicData.ownerMedicId);
        if (!owner) {
            throw new NotFoundError('Owner medic not found');
        }

        const id = clinicData.id || this.idGenerator();
        const dataToSave = {
            ...clinicData,
            id,
            displayId: clinicData.displayId || Clinic.displayIdFor(clinicData.name),
            type: clinicData.type || 'organization',
            isDefault: clinicData.isDefault === true,
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

    /**
     * Public entry point for creating an additional workspace. Only the caller can
     * become the owner and the new clinic is never the default one.
     */
    async createSharedClinic({ name, ownerMedicId, ...rest }) {
        const trimmedName = typeof name === 'string' ? name.trim() : '';
        if (!trimmedName) {
            throw new BadRequestError('Clinic name is required');
        }

        const submittedFields = Object.fromEntries(
            Object.entries(rest).filter(([key]) => !SERVER_OWNED_FIELDS.has(key))
        );

        return this.createClinic({
            ...submittedFields,
            name: trimmedName,
            ownerMedicId,
            type: 'organization',
            isDefault: false,
        });
    }

    async getClinicById(id) {
        if (!id) {
            return null;
        }
        return this.clinicRepository.getClinicById(id);
    }

    async markAsDefaultWorkspace(clinicId) {
        const record = await this.clinicRepository.getClinicById(clinicId);
        if (!record || record.isDefault === true) {
            return record || null;
        }

        return this.clinicRepository.updateClinic(clinicId, {
            ...record,
            isDefault: true,
            type: record.type || 'personal',
        });
    }

    /**
     * The default workspace is created with the account and is tied to its life:
     * it is the medic's personal clinic and cannot be shared or removed on its own.
     */
    async isDefaultWorkspaceClinic(record) {
        if (!record) {
            return false;
        }

        const clinic = new Clinic(record);
        if (clinic.isDefaultWorkspace()) {
            return true;
        }

        if (!clinic.ownerMedicId) {
            return false;
        }

        const owner = await this.medicRepository.getMedicById(clinic.ownerMedicId);
        return clinic.isDefaultWorkspace(owner);
    }

    async getClinic(id, requesterMedicId = null) {
        const record = await this.clinicRepository.getClinicById(id);
        if (!record) {
            return null;
        }

        if (requesterMedicId) {
            await this.assertActiveMember(id, requesterMedicId);
        }

        const [members, invitations] = await Promise.all([
            this.clinicRepository.listClinicMembers(id),
            this.clinicRepository.listClinicInvitations(id),
        ]);

        const owner = record.ownerMedicId
            ? await this.medicRepository.getMedicById(record.ownerMedicId)
            : null;

        return {
            ...record,
            displayId: new Clinic(record).displayIdOrDefault(),
            ownerName: owner?.name || null,
            ownerEmail: owner?.email || null,
            members,
            invitations,
        };
    }

    async assertActiveMember(clinicId, medicId) {
        const membership = ClinicMembership.from(
            await this.clinicRepository.getClinicMember(clinicId, medicId)
        );

        if (!membership || !membership.isActive()) {
            throw new ForbiddenError('Medic does not have access to this clinic');
        }

        return membership;
    }

    async getClinicMembers(clinicId, requesterMedicId = null) {
        if (requesterMedicId) {
            await this.assertActiveMember(clinicId, requesterMedicId);
        }

        return this.clinicRepository.listClinicMembers(clinicId);
    }

    async listMedicClinics(medicId) {
        if (!medicId) {
            throw new BadRequestError('Medic ID is required');
        }

        const memberships = await this.clinicRepository.listClinicsByMedicId(medicId);
        const clinics = await Promise.all(
            memberships.map(async (membershipRecord) => {
                const clinicRecord = await this.clinicRepository.getClinicById(membershipRecord.clinicId);
                if (!clinicRecord) {
                    return null;
                }

                const [members, invitations, owner] = await Promise.all([
                    this.clinicRepository.listClinicMembers(membershipRecord.clinicId),
                    this.clinicRepository.listClinicInvitations(membershipRecord.clinicId),
                    clinicRecord.ownerMedicId
                        ? this.medicRepository.getMedicById(clinicRecord.ownerMedicId)
                        : Promise.resolve(null),
                ]);

                return {
                    ...clinicRecord,
                    displayId: new Clinic(clinicRecord).displayIdOrDefault(),
                    ownerName: owner?.name || null,
                    ownerEmail: owner?.email || null,
                    members,
                    invitations,
                    membership: {
                        role: membershipRecord.role,
                        status: membershipRecord.status,
                        joinedAt: membershipRecord.joinedAt,
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
                    clinicDisplayId: new Clinic(clinic).displayIdOrDefault(),
                    clinicType: clinic.type,
                };
            })
        );

        return pendingInvitations.filter(Boolean);
    }

    async resolveClinicForMedic(medicId, preferredClinicId = null) {
        const clinics = await this.listMedicClinics(medicId);
        if (!clinics.length) {
            throw new BadRequestError('Medic does not belong to any clinic');
        }

        if (preferredClinicId) {
            const preferred = clinics.find((clinic) => clinic.id === preferredClinicId);
            if (!preferred) {
                throw new ForbiddenError('Medic does not have access to the selected clinic');
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
            throw new UnauthorizedError('requesterMedicId is required');
        }

        const [record, membership] = await Promise.all([
            this.clinicRepository.getClinicById(clinicId),
            this.clinicRepository.getClinicMember(clinicId, requesterMedicId),
        ]);

        if (!record) {
            throw new NotFoundError('Clinic not found');
        }

        const actor = ClinicMembership.from(membership);
        if (!actor || !actor.isActive()) {
            throw new ForbiddenError('Medic does not have access to this clinic');
        }

        if (!actor.canManage()) {
            throw new ForbiddenError('Only owners or admins can update clinic details');
        }

        const nextName = updateData?.name?.trim();
        if (!nextName) {
            throw new BadRequestError('Clinic name is required');
        }

        await this.clinicRepository.updateClinic(clinicId, {
            ...record,
            name: nextName,
            displayId: record.displayId || Clinic.fallbackDisplayId(clinicId),
        });

        return this.getClinic(clinicId, requesterMedicId);
    }

    async inviteMedic(clinicId, inviteData, requesterMedicId = null) {
        if (!inviteData.invitedEmail) {
            throw new BadRequestError('invitedEmail is required');
        }

        const clinic = await this.clinicRepository.getClinicById(clinicId);
        if (!clinic) {
            throw new NotFoundError('Clinic not found');
        }

        if (await this.isDefaultWorkspaceClinic(clinic)) {
            throw new ForbiddenError('Collaborators can only be invited to a shared workspace');
        }

        if (requesterMedicId) {
            const membership = ClinicMembership.from(
                await this.clinicRepository.getClinicMember(clinicId, requesterMedicId)
            );

            if (!membership || !membership.isActive()) {
                throw new ForbiddenError('Medic does not have access to this clinic');
            }

            if (!membership.canManage()) {
                throw new ForbiddenError('Only owners or admins can invite clinic members');
            }
        }

        const existingMedic = await this.medicRepository.getMedicByEmail(inviteData.invitedEmail);
        if (existingMedic) {
            const membership = ClinicMembership.from(
                await this.clinicRepository.getClinicMember(clinicId, existingMedic.id)
            );
            if (membership?.isActive()) {
                throw new ConflictError('Medic is already a member of this clinic');
            }
        }

        const existingInvitations = await this.clinicRepository.listClinicInvitations(clinicId);
        const hasPendingInvitation = existingInvitations.some(
            (invitation) => invitation.invitedEmail === inviteData.invitedEmail && invitation.status === 'pending'
        );
        if (hasPendingInvitation) {
            throw new ConflictError('There is already a pending invitation for this email');
        }

        const invitation = {
            id: inviteData.id || this.idGenerator(),
            clinicId,
            invitedEmail: inviteData.invitedEmail,
            invitedByMedicId: inviteData.invitedByMedicId,
            medicId: existingMedic?.id || null,
            role: inviteData.role || 'member',
            status: 'pending',
        };

        return this.clinicRepository.createInvitation(clinicId, invitation);
    }

    /**
     * Sends the invitation mail off the request path: the inviter already got their
     * response, and a provider outage is recorded instead of surfaced.
     */
    async sendInvitationEmail({ clinicId, invitationId, inviterMedicId }) {
        const [clinic, invitation, inviter] = await Promise.all([
            this.clinicRepository.getClinicById(clinicId),
            this.clinicRepository.getInvitation(clinicId, invitationId),
            inviterMedicId ? this.medicRepository.getMedicById(inviterMedicId) : Promise.resolve(null),
        ]);

        if (!clinic || !invitation) {
            console.error('[ClinicService] invitation email skipped', JSON.stringify({ clinicId, invitationId, reason: 'invitation not found' }));
            return { delivered: false, reason: 'invitation_not_found' };
        }

        const delivery = await this.emailService.sendWorkspaceInviteEmail({
            to: invitation.invitedEmail,
            workspaceName: clinic.name,
            inviterName: inviter?.name,
            inviteCode: invitation.id,
            userId: inviter?.id || null,
        });

        if (!delivery.delivered && inviter?.id) {
            try {
                await this.analyticsService.trackEmailDeliveryFailure(inviter.id, delivery);
            } catch (error) {
                console.error('[ClinicService] Failed to record invite email failure:', error.message);
            }
        }

        return delivery;
    }

    async acceptInvitation(clinicId, inviteId, medicId) {
        const [invitation, clinic, medic] = await Promise.all([
            this.clinicRepository.getInvitation(clinicId, inviteId),
            this.clinicRepository.getClinicById(clinicId),
            this.medicRepository.getMedicById(medicId),
        ]);

        if (!clinic) {
            throw new NotFoundError('Clinic not found');
        }
        if (!invitation) {
            throw new NotFoundError('Invitation not found');
        }
        if (!medic) {
            throw new NotFoundError('Medic not found');
        }
        if (invitation.status === 'accepted') {
            throw new ConflictError('Invitation has already been accepted');
        }
        if (invitation.invitedEmail !== medic.email) {
            throw new ForbiddenError('Invitation does not belong to this medic');
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
            throw new UnauthorizedError('requesterMedicId is required');
        }

        const clinic = await this.clinicRepository.getClinicById(clinicId);
        if (!clinic) {
            throw new NotFoundError('Clinic not found');
        }

        const [requesterMembership, targetMembership] = await Promise.all([
            this.clinicRepository.getClinicMember(clinicId, requesterMedicId),
            this.clinicRepository.getClinicMember(clinicId, targetMedicId),
        ]);

        const actor = ClinicMembership.from(requesterMembership);
        if (!actor || !actor.isActive()) {
            throw new ForbiddenError('Medic does not have access to this clinic');
        }

        if (!targetMembership) {
            throw new NotFoundError('Clinic member not found');
        }

        const isSelfRemoval = String(requesterMedicId) === String(targetMedicId);
        if (!actor.canManage() && !isSelfRemoval) {
            throw new ForbiddenError('Only owners or admins can remove clinic members');
        }

        if (targetMembership.role === 'owner') {
            throw new ConflictError('Transfer ownership before removing the clinic owner');
        }

        await this.clinicRepository.deleteClinicMember(clinicId, targetMedicId);
        return this.getClinic(clinicId, requesterMedicId);
    }

    async transferOwnership(clinicId, newOwnerMedicId, requesterMedicId = null) {
        if (!newOwnerMedicId) {
            throw new BadRequestError('newOwnerMedicId is required');
        }

        const clinic = await this.clinicRepository.getClinicById(clinicId);
        if (!clinic) {
            throw new NotFoundError('Clinic not found');
        }

        if (requesterMedicId && String(clinic.ownerMedicId) !== String(requesterMedicId)) {
            throw new ForbiddenError('Only the clinic owner can transfer ownership');
        }

        const [currentOwner, nextOwnerMembership, nextOwnerMedic] = await Promise.all([
            this.clinicRepository.getClinicMember(clinicId, clinic.ownerMedicId),
            this.clinicRepository.getClinicMember(clinicId, newOwnerMedicId),
            this.medicRepository.getMedicById(newOwnerMedicId),
        ]);

        if (!nextOwnerMedic) {
            throw new NotFoundError('New owner medic not found');
        }

        if (!nextOwnerMembership || nextOwnerMembership.status !== 'active') {
            throw new BadRequestError('New owner must already be an active clinic member');
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
            throw new UnauthorizedError('requesterMedicId is required');
        }

        const [clinic, membershipRecord] = await Promise.all([
            this.clinicRepository.getClinicById(clinicId),
            this.clinicRepository.getClinicMember(clinicId, requesterMedicId),
        ]);

        if (!clinic) {
            throw new NotFoundError('Clinic not found');
        }

        const membership = ClinicMembership.from(membershipRecord);
        if (!membership || !membership.isActive()) {
            throw new ForbiddenError('Medic does not have access to this clinic');
        }

        if (!membership.canManage()) {
            throw new ForbiddenError('Only owners or admins can delete a clinic');
        }

        if (await this.isDefaultWorkspaceClinic(clinic)) {
            throw new ConflictError('The default workspace can only be removed together with the account');
        }

        await this.patientDirectory.deletePatientsByClinicId(clinicId);
        await this.clinicRepository.deleteClinic(clinicId);

        return {
            deleted: true,
            clinicId,
        };
    }

    buildClinicDisplayId(name) {
        return Clinic.displayIdFor(name);
    }

    buildFallbackClinicDisplayId(id) {
        return Clinic.fallbackDisplayId(id);
    }
}

module.exports = ClinicService;
