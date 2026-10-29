const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const MedicRepository = require('../infrastructure/MedicRepository');
const EmailService = require('../../email/application/EmailService');
const SessionService = require('./SessionService');
const UserAnalyticsService = require('../../analytics/application/UserAnalyticsService');
const PatientService = require('../../patients/application/PatientService');
const PatientSeedService = require('../../patients/application/PatientSeedService');
const ClinicService = require('../../clinic/application/ClinicService');
const { PasswordHasher } = require('../infrastructure/PasswordHasher');
const { Medic, WORKSPACE_MIGRATION_VERSION } = require('../domain/Medic');
const { ApiKey } = require('../domain/ApiKey');
const { Password } = require('../domain/Password');
const {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
} = require('../../../shared/errors/AppError');

/**
 * Account lifecycle use cases: creation, profile, API keys, Google linking and password
 * recovery. Collaborators arrive through the constructor so the composition root owns
 * the wiring and tests can replace one dependency at a time.
 */
class MedicService {
    constructor({
        medicRepository = new MedicRepository(),
        patientService = null,
        patientSeedService = null,
        clinicService = null,
        emailService = new EmailService(),
        sessionService = new SessionService(),
        analyticsService = new UserAnalyticsService(),
        passwordHasher = new PasswordHasher(),
        idGenerator = uuidv4,
    } = {}) {
        this.medicRepository = medicRepository;

        // Build the fallback graph in dependency order so that direct construction
        // outside the composition root still injects the repository these need.
        this.clinicService = clinicService || new ClinicService({ medicRepository });
        this.patientService = patientService
            || new PatientService({ medicRepository, clinicService: this.clinicService });
        this.patientSeedService = patientSeedService
            || new PatientSeedService({ patientService: this.patientService });
        this.emailService = emailService;
        this.sessionService = sessionService;
        this.analyticsService = analyticsService;
        this.passwordHasher = passwordHasher;
        this.idGenerator = idGenerator;
    }

    async createMedic(medicData) {
        if (!medicData.name || !medicData.email) {
            throw new BadRequestError('Name and email are required');
        }

        const existingMedic = await this.medicRepository.getMedicByEmail(medicData.email);
        if (existingMedic) {
            throw new ConflictError('A medic with this email already exists');
        }

        const apiKey = ApiKey.generate();

        const newMedic = {
            id: medicData.id || this.idGenerator(),
            subscriptionPlan: medicData.subscriptionPlan || 'free',
            apiKey: null,
            apiKeyHash: medicData.apiKeyHash || apiKey.hash,
            apiKeyPrefix: medicData.apiKeyPrefix || apiKey.prefix,
            apiKeyLastRotatedAt: new Date().toISOString(),
            ...medicData,
        };

        await this.medicRepository.createMedic(newMedic);

        const personalClinic = await this.clinicService.createClinic({
            name: medicData.clinicName || `${medicData.name}'s Clinic`,
            ownerMedicId: newMedic.id,
            type: 'personal',
            isDefault: true,
        });

        const createdMedic = await this.medicRepository.updateMedic(newMedic.id, {
            ...newMedic,
            defaultClinicId: personalClinic.id,
        });

        // Always seed mock data for new medic accounts in this stage
        await this.patientSeedService.seedForMedic(newMedic.id);

        return this.toPublicMedic({
            ...createdMedic,
            apiKey: apiKey.rawKey,
        });
    }

    async getMedic(id) {
        if (!id) {
            throw new BadRequestError('Medic ID is required');
        }
        return this.medicRepository.getMedicById(id);
    }

    /**
     * Guarantees that the account owns exactly one default workspace and that patients
     * created before workspaces existed are attached to it. Runs for accounts created
     * before this structure existed and is stamped so it only costs one read afterwards.
     */
    async ensureDefaultWorkspace(medicId) {
        if (!medicId) {
            throw new BadRequestError('Medic ID is required');
        }

        const record = await this.getMedic(medicId);
        if (!record) {
            return null;
        }

        const medic = new Medic(record);
        if (medic.hasWorkspaceMigration()) {
            return record;
        }

        let defaultClinic = await this.clinicService.getClinicById(medic.defaultClinicId);

        if (!defaultClinic) {
            // Older accounts may already own a personal clinic that was never linked back.
            const ownedClinics = await this.clinicService.listOwnedClinics(medicId);
            defaultClinic = ownedClinics.find((clinic) => clinic.type === 'personal')
                || ownedClinics[0]
                || null;
        }

        if (!defaultClinic) {
            defaultClinic = await this.clinicService.createClinic({
                name: medic.name ? `${medic.name}'s Clinic` : 'My Clinic',
                ownerMedicId: medicId,
                type: 'personal',
                isDefault: true,
            });
        } else {
            const flagged = await this.clinicService.markAsDefaultWorkspace(defaultClinic.id);
            defaultClinic = flagged || defaultClinic;
        }

        await this.medicRepository.updateMedic(medicId, {
            ...medic.toRecord(),
            defaultClinicId: defaultClinic.id,
            workspaceMigrationVersion: WORKSPACE_MIGRATION_VERSION,
        });

        await this.patientService.assignPatientsWithoutClinic(medicId, defaultClinic.id);

        return this.getMedic(medicId);
    }

    async getMedicProfile(id) {
        const record = await this.ensureDefaultWorkspace(id);
        if (!record) {
            return null;
        }

        const medic = new Medic(record);
        const [clinics, pendingInvitations] = await Promise.all([
            this.clinicService.listMedicClinics(id),
            this.clinicService.listPendingInvitationsForMedic(id),
        ]);

        return {
            ...medic.toPublic(),
            clinics,
            pendingInvitations,
            apiKeyMasked: medic.maskedApiKey(),
        };
    }

    async getMedicByEmail(email) {
        if (!email) {
            throw new BadRequestError('Email is required');
        }
        return this.medicRepository.getMedicByEmail(email);
    }

    async updateMedicProfile(medicId, updates = {}) {
        if (!medicId) {
            throw new BadRequestError('Medic ID is required');
        }

        const record = await this.getMedic(medicId);
        if (!record) {
            throw new NotFoundError('Medic not found');
        }

        const allowedFields = ['name', 'email', 'phone', 'location', 'license', 'specialization'];
        const sanitizedUpdates = allowedFields.reduce((acc, field) => {
            if (updates[field] !== undefined) {
                acc[field] = typeof updates[field] === 'string' ? updates[field].trim() : updates[field];
            }
            return acc;
        }, {});

        if (sanitizedUpdates.email && sanitizedUpdates.email !== record.email) {
            const existingMedic = await this.medicRepository.getMedicByEmail(sanitizedUpdates.email);
            if (existingMedic && String(existingMedic.id) !== String(medicId)) {
                throw new ConflictError('A medic with this email already exists');
            }
        }

        if (sanitizedUpdates.name !== undefined && !sanitizedUpdates.name) {
            throw new BadRequestError('Name is required');
        }

        if (sanitizedUpdates.email !== undefined && !sanitizedUpdates.email) {
            throw new BadRequestError('Email is required');
        }

        await this.medicRepository.updateMedic(medicId, {
            ...record,
            ...sanitizedUpdates,
        });

        return this.getMedicProfile(medicId);
    }

    async getMedicByApiKey(apiKey) {
        if (!apiKey) {
            throw new BadRequestError('API key is required');
        }

        const medic = await this.medicRepository.getMedicByApiKeyHash(ApiKey.hash(apiKey));
        if (medic) {
            await this.touchApiKeyUsage(medic);
            return medic;
        }

        const legacyMedic = await this.medicRepository.getMedicByLegacyApiKey(apiKey);
        if (!legacyMedic) {
            return null;
        }

        const migratedMedic = await this.migrateLegacyApiKey(legacyMedic, apiKey);
        await this.touchApiKeyUsage(migratedMedic);
        return migratedMedic;
    }

    async getMedicPatients(medicId, clinicId = null) {
        if (clinicId) {
            return this.patientService.getPatientsByClinic(medicId, clinicId);
        }

        return this.patientService.getPatientsByMedicId(medicId);
    }

    async listMedicClinics(medicId) {
        return this.clinicService.listMedicClinics(medicId);
    }

    async rotateApiKey(medicId) {
        const record = await this.getMedic(medicId);
        if (!record) {
            throw new NotFoundError('Medic not found');
        }

        const apiKey = ApiKey.generate();

        const updatedMedic = await this.medicRepository.updateMedic(medicId, {
            ...record,
            apiKey: null,
            apiKeyHash: apiKey.hash,
            apiKeyPrefix: apiKey.prefix,
            apiKeyLastRotatedAt: new Date().toISOString(),
        });

        return {
            ...this.toPublicMedic(updatedMedic),
            apiKey: apiKey.rawKey,
            apiKeyMasked: this.getApiKeyMaskedValue(updatedMedic),
        };
    }

    async deleteMedicAndPatients(medicId, transferOwnershipTo = null) {
        const record = await this.getMedic(medicId);
        if (!record) {
            throw new NotFoundError('Medic not found');
        }

        const ownedClinics = await this.clinicService.listOwnedClinics(medicId);
        for (const clinic of ownedClinics) {
            const members = await this.clinicService.getClinicMembers(clinic.id);
            const otherActiveMembers = members.filter((member) => member.medicId !== medicId && member.status === 'active');

            if (otherActiveMembers.length) {
                const targetOwner = transferOwnershipTo?.[clinic.id] || transferOwnershipTo;
                if (!targetOwner) {
                    throw new ConflictError(`Ownership transfer is required before deleting medic for clinic ${clinic.name}`);
                }

                await this.clinicService.transferOwnership(clinic.id, targetOwner);
            }
        }

        await this.patientService.deletePatientsByOwnerMedicId(medicId);

        const clinics = await this.clinicService.listMedicClinics(medicId);
        for (const clinic of clinics) {
            await this.clinicService.removeMedicFromClinic(clinic.id, medicId);
        }

        await this.sessionService.revokeAllForMedic(medicId);
        await this.medicRepository.deleteMedic(medicId);
        return { deleted: true, medicId };
    }

    toPublicMedic(record) {
        const medic = Medic.from(record);
        return medic ? medic.toPublic() : null;
    }

    getApiKeyMaskedValue(record) {
        const medic = Medic.from(record);
        return medic ? medic.maskedApiKey() : null;
    }

    async touchApiKeyUsage(record) {
        await this.medicRepository.updateMedic(record.id, {
            ...record,
            apiKeyLastUsedAt: new Date().toISOString(),
        });
    }

    async migrateLegacyApiKey(record, legacyApiKey) {
        return this.medicRepository.updateMedic(record.id, {
            ...record,
            apiKey: null,
            apiKeyHash: ApiKey.hash(legacyApiKey),
            apiKeyPrefix: record.apiKeyPrefix || legacyApiKey.slice(0, 10),
            apiKeyLastRotatedAt: record.apiKeyLastRotatedAt || new Date().toISOString(),
        });
    }

    async createPasswordResetRequest(email) {
        if (!email) {
            throw new BadRequestError('Email is required');
        }

        const medic = await this.getMedicByEmail(email);
        if (!medic) {
            return { accepted: true };
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        const resetUrlBase = process.env.PASSWORD_RESET_URL || 'http://localhost:5173/reset-password';
        const resetUrl = `${resetUrlBase}?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`;

        await this.medicRepository.savePasswordResetState(medic.id, {
            passwordResetTokenHash: this.hashResetSecret(rawToken),
            passwordResetCodeHash: this.hashResetSecret(verificationCode),
            passwordResetExpiresAt: expiresAt,
        });

        const delivery = await this.emailService.sendPasswordResetEmail({
            to: email,
            resetUrl,
            code: verificationCode,
            expiresInMinutes: 15,
            userId: medic.id,
        });

        if (!delivery.delivered) {
            await this.recordEmailFailure(medic.id, delivery);
        }

        return { accepted: true, emailDelivered: delivery.delivered };
    }

    async sendWelcomeEmail(medic) {
        const delivery = await this.emailService.sendWelcomeEmail({
            to: medic.email,
            name: medic.name,
            userId: medic.id,
        });

        if (!delivery.delivered) {
            await this.recordEmailFailure(medic.id, delivery);
        }

        return delivery;
    }

    /**
     * Google sign-in reuses the existing account when the (verified) email already
     * belongs to one, so the person keeps the same data and can still log in with a
     * password. `googleId` is stored on the record; lookups stay email-based because
     * non-whitelisted attributes are not filterable in DynamoDB.
     */
    async findOrCreateGoogleAccount({ id, email, emailVerified, name }) {
        if (!email) {
            throw new BadRequestError('Google account has no email');
        }

        if (!emailVerified) {
            throw new ForbiddenError('Google account email is not verified');
        }

        const existing = await this.getMedicByEmail(email);

        if (existing) {
            const medic = new Medic(existing);

            if (medic.isGoogleLinkedTo(id)) {
                throw new ConflictError('This email is already linked to a different Google account');
            }

            if (!medic.isGoogleLinked()) {
                const linked = await this.medicRepository.updateMedic(medic.id, {
                    ...medic.toRecord(),
                    ...medic.linkGoogle(id),
                });

                return { medic: linked || existing, isNewlyCreated: false };
            }

            return { medic: existing, isNewlyCreated: false };
        }

        const created = await this.createMedic({
            name: name || email.split('@')[0],
            email,
            passwordHash: null,
            googleId: id,
            googleEmailVerified: true,
            authProviders: ['google'],
        });

        return { medic: created, isNewlyCreated: true };
    }

    async recordEmailFailure(userId, delivery = {}) {
        try {
            await this.analyticsService.trackEmailDeliveryFailure(userId, delivery);
        } catch (error) {
            console.error('[MedicService] Failed to record email delivery failure:', error.message);
        }
    }

    async resetPassword({ email, token, code, newPassword }) {
        if (!email || !newPassword || (!token && !code)) {
            throw new BadRequestError('email, newPassword and token or code are required');
        }

        Password.assertValid(newPassword);

        const record = await this.getMedicByEmail(email);
        if (!record) {
            throw new BadRequestError('Invalid or expired reset request');
        }

        const medic = new Medic(record);
        if (medic.isPasswordResetExpired()) {
            throw new BadRequestError('Invalid or expired reset request');
        }

        const tokenValid = token && record.passwordResetTokenHash === this.hashResetSecret(token);
        const codeValid = code && record.passwordResetCodeHash === this.hashResetSecret(code);

        if (!tokenValid && !codeValid) {
            throw new BadRequestError('Invalid or expired reset request');
        }

        await this.medicRepository.updateMedic(medic.id, {
            ...medic.toRecord(),
            passwordHash: await this.passwordHasher.hash(newPassword),
            passwordResetTokenHash: null,
            passwordResetCodeHash: null,
            passwordResetExpiresAt: null,
        });

        // A password reset is recovery: whoever held an older session must lose it.
        try {
            await this.sessionService.revokeAllForMedic(medic.id);
        } catch (error) {
            console.error('[MedicService] Password reset succeeded but sessions could not be revoked:', error.message);
        }

        return { reset: true };
    }

    async changePassword({ medicId, currentPassword, newPassword }) {
        if (!medicId || !currentPassword || !newPassword) {
            throw new BadRequestError('medicId, currentPassword and newPassword are required');
        }

        Password.assertValid(newPassword);

        const record = await this.getMedic(medicId);
        const medic = Medic.from(record);
        if (!medic || !medic.hasPassword()) {
            throw new BadRequestError('Account password is not configured');
        }

        const matches = await this.passwordHasher.compare(currentPassword, medic.passwordHash);
        if (!matches) {
            throw new UnauthorizedError('Current password is incorrect');
        }

        await this.medicRepository.updateMedic(medic.id, {
            ...medic.toRecord(),
            passwordHash: await this.passwordHasher.hash(newPassword),
        });

        return { changed: true };
    }

    hashResetSecret(value) {
        return crypto.createHash('sha256').update(String(value)).digest('hex');
    }
}

module.exports = MedicService;
module.exports.WORKSPACE_MIGRATION_VERSION = WORKSPACE_MIGRATION_VERSION;
