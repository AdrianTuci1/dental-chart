const ClinicRepository = require('../models/repositories/ClinicRepository');
const MedicRepository = require('../models/repositories/MedicRepository');
const { v4: uuidv4 } = require('uuid');
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

        return this.getClinic(id);
    }

    async getClinic(id) {
        const clinic = await this.clinicRepository.getClinicById(id);
        if (!clinic) {
            return null;
        }

        const [members, invitations] = await Promise.all([
            this.clinicRepository.listClinicMembers(id),
            this.clinicRepository.listClinicInvitations(id),
        ]);

        return {
            ...clinic,
            members,
            invitations,
        };
    }

    async getClinicMembers(clinicId) {
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

                return {
                    ...clinic,
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

    async inviteMedic(clinicId, inviteData) {
        if (!inviteData.invitedEmail) {
            throw createHttpError('invitedEmail is required', 400);
        }

        const clinic = await this.clinicRepository.getClinicById(clinicId);
        if (!clinic) {
            throw createHttpError('Clinic not found', 404);
        }

        const existingMedic = await this.medicRepository.getMedicByEmail(inviteData.invitedEmail);
        if (existingMedic) {
            const membership = await this.clinicRepository.getClinicMember(clinicId, existingMedic.id);
            if (membership?.status === 'active') {
                throw createHttpError('Medic is already a member of this clinic', 409);
            }
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

        return this.getClinic(clinicId);
    }

    async transferOwnership(clinicId, newOwnerMedicId) {
        if (!newOwnerMedicId) {
            throw createHttpError('newOwnerMedicId is required', 400);
        }

        const clinic = await this.clinicRepository.getClinicById(clinicId);
        if (!clinic) {
            throw createHttpError('Clinic not found', 404);
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

        return this.getClinic(clinicId);
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
}

module.exports = ClinicService;
