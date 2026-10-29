const { ForbiddenError, BadRequestError } = require('../../../shared/errors/AppError');

/**
 * Platform administration. Access is granted by e-mail through PLATFORM_ADMIN_EMAILS, so a
 * self-hosted instance needs no migration and no seeded role. The identity module owns the
 * account records; this service only decides who may read and change them.
 */
class AdminService {
    constructor({ config, medicService } = {}) {
        this.admins = new Set((config?.admin?.emails || []).map((email) => email.toLowerCase()));
        this.medicService = medicService;
    }

    isPlatformAdmin(record) {
        const email = String(record?.email || '').toLowerCase();
        return Boolean(email) && this.admins.has(email);
    }

    assertPlatformAdmin(record) {
        if (!record || !this.isPlatformAdmin(record)) {
            throw new ForbiddenError('This account is not a platform administrator');
        }

        if (record.status === 'disabled') {
            throw new ForbiddenError('This administrator account is disabled');
        }

        return record;
    }

    async assertActor(medicId) {
        const record = await this.medicService.getMedic(medicId);
        return this.assertPlatformAdmin(record);
    }

    async listAccounts(query = {}) {
        return this.medicService.listAccounts(query);
    }

    async getAccount(medicId) {
        return this.medicService.getAccount(medicId);
    }

    async setAccountStatus(medicId, status, actorMedicId) {
        if (String(medicId) === String(actorMedicId) && status === 'disabled') {
            throw new BadRequestError('You cannot disable the administrator account you are signed in with');
        }

        return this.medicService.setAccountStatus(medicId, status);
    }

    async deleteAccount(medicId, actorMedicId) {
        if (String(medicId) === String(actorMedicId)) {
            throw new BadRequestError('You cannot delete the administrator account you are signed in with');
        }

        return this.medicService.deleteMedicAndPatients(medicId);
    }
}

module.exports = AdminService;
