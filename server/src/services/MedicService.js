const MedicRepository = require('../models/repositories/MedicRepository');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { MOCK_PATIENTS_TEMPLATES } = require('../utils/mockData');
const { createApiKeyRecord, hashApiKey, maskApiKey } = require('../utils/apiKeys');
const { createHttpError } = require('../utils/httpError');
const EmailService = require('./EmailService');

// Import other services to seed data
const PatientService = require('./PatientService');
const HistoryService = require('./HistoryService');
const TreatmentPlanService = require('./TreatmentPlanService');
const ClinicService = require('./ClinicService');

class MedicService {
    constructor() {
        this.medicRepository = new MedicRepository();
        this.patientService = new PatientService();
        this.historyService = new HistoryService();
        this.treatmentPlanService = new TreatmentPlanService();
        this.clinicService = new ClinicService();
        this.emailService = new EmailService();
    }

    async createMedic(medicData) {
        if (!medicData.name || !medicData.email) {
            throw createHttpError('Name and email are required', 400);
        }

        const existingMedic = await this.medicRepository.getMedicByEmail(medicData.email);
        if (existingMedic) {
            throw createHttpError('A medic with this email already exists', 409);
        }

        const apiKeyRecord = createApiKeyRecord();

        const newMedic = {
            id: medicData.id || uuidv4(),
            subscriptionPlan: medicData.subscriptionPlan || 'free',
            apiKey: null,
            apiKeyHash: medicData.apiKeyHash || apiKeyRecord.hash,
            apiKeyPrefix: medicData.apiKeyPrefix || apiKeyRecord.prefix,
            apiKeyLastRotatedAt: new Date().toISOString(),
            ...medicData,
        };

        await this.medicRepository.createMedic(newMedic);

        const personalClinic = await this.clinicService.createClinic({
            name: medicData.clinicName || `${medicData.name}'s Clinic`,
            ownerMedicId: newMedic.id,
            type: 'personal',
        });

        const createdMedic = await this.medicRepository.updateMedic(newMedic.id, {
            ...newMedic,
            defaultClinicId: personalClinic.id,
        });

        // Always seed mock data for new medic accounts in this stage
        await this.seedMedicData(newMedic.id);

        return this.toPublicMedic({
            ...createdMedic,
            apiKey: apiKeyRecord.rawKey,
        });
    }

    async seedMedicData(medicId) {
        for (const patient of MOCK_PATIENTS_TEMPLATES) {
            const { history, treatmentPlan, ...patientInfo } = patient;
            
            // 1. Create Patient (stripping the template ID so a new one is generated if needed, 
            // but PatientService now matches by ID if provided, which is fine for mock-1)
            const createdPatient = await this.patientService.createPatient({
                ...patientInfo,
                medicId: medicId
            }, { skipPlanLimit: true });

            // 2. Create Treatment Plan (Bulk)
            if (treatmentPlan && treatmentPlan.items) {
                await this.treatmentPlanService.updateTreatmentPlan(createdPatient.id, treatmentPlan.items);
            }

            // 3. Create History (Bulk)
            if (history && history.completedItems) {
                await this.historyService.updateHistory(createdPatient.id, history.completedItems);
            }
        }
    }

    async getMedic(id) {
        if (!id) {
            throw createHttpError('Medic ID is required', 400);
        }
        return await this.medicRepository.getMedicById(id);
    }

    async getMedicProfile(id) {
        const medic = await this.getMedic(id);
        if (!medic) {
            return null;
        }

        const clinics = await this.clinicService.listMedicClinics(id);
        return {
            ...this.toPublicMedic(medic),
            clinics,
            apiKeyMasked: this.getApiKeyMaskedValue(medic),
        };
    }

    async getMedicByEmail(email) {
        if (!email) {
            throw createHttpError('Email is required', 400);
        }
        return await this.medicRepository.getMedicByEmail(email);
    }

    async getMedicByApiKey(apiKey) {
        if (!apiKey) {
            throw createHttpError('API key is required', 400);
        }

        const apiKeyHash = hashApiKey(apiKey);
        const medic = await this.medicRepository.getMedicByApiKeyHash(apiKeyHash);
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

    async getMedicPatients(medicId) {
        return await this.patientService.getPatientsByMedicId(medicId);
    }

    async listMedicClinics(medicId) {
        return this.clinicService.listMedicClinics(medicId);
    }

    async rotateApiKey(medicId) {
        const medic = await this.getMedic(medicId);
        if (!medic) {
            throw createHttpError('Medic not found', 404);
        }

        const apiKeyRecord = createApiKeyRecord();

        const updatedMedic = await this.medicRepository.updateMedic(medicId, {
            ...medic,
            apiKey: null,
            apiKeyHash: apiKeyRecord.hash,
            apiKeyPrefix: apiKeyRecord.prefix,
            apiKeyLastRotatedAt: new Date().toISOString(),
        });

        return {
            ...this.toPublicMedic(updatedMedic),
            apiKey: apiKeyRecord.rawKey,
            apiKeyMasked: this.getApiKeyMaskedValue(updatedMedic),
        };
    }

    async deleteMedicAndPatients(medicId, transferOwnershipTo = null) {
        const medic = await this.getMedic(medicId);
        if (!medic) {
            throw createHttpError('Medic not found', 404);
        }

        const ownedClinics = await this.clinicService.listOwnedClinics(medicId);
        for (const clinic of ownedClinics) {
            const members = await this.clinicService.getClinicMembers(clinic.id);
            const otherActiveMembers = members.filter((member) => member.medicId !== medicId && member.status === 'active');

            if (otherActiveMembers.length) {
                const targetOwner = transferOwnershipTo?.[clinic.id] || transferOwnershipTo;
                if (!targetOwner) {
                    throw createHttpError(`Ownership transfer is required before deleting medic for clinic ${clinic.name}`, 409);
                }

                await this.clinicService.transferOwnership(clinic.id, targetOwner);
            }
        }

        await this.patientService.deletePatientsByOwnerMedicId(medicId);

        const clinics = await this.clinicService.listMedicClinics(medicId);
        for (const clinic of clinics) {
            await this.clinicService.removeMedicFromClinic(clinic.id, medicId);
        }

        await this.medicRepository.deleteMedic(medicId);
        return { deleted: true, medicId };
    }

    toPublicMedic(medic) {
        if (!medic) {
            return null;
        }

        const {
            passwordHash,
            apiKeyHash,
            apiKeyPrefix,
            ...publicMedic
        } = medic;

        return publicMedic;
    }

    getApiKeyMaskedValue(medic) {
        if (medic?.apiKey) {
            return maskApiKey(medic.apiKey);
        }

        if (medic?.apiKeyPrefix) {
            return `${medic.apiKeyPrefix}...`;
        }

        return null;
    }

    async touchApiKeyUsage(medic) {
        await this.medicRepository.updateMedic(medic.id, {
            ...medic,
            apiKeyLastUsedAt: new Date().toISOString(),
        });
    }

    async migrateLegacyApiKey(medic, legacyApiKey) {
        const updatedMedic = await this.medicRepository.updateMedic(medic.id, {
            ...medic,
            apiKey: null,
            apiKeyHash: hashApiKey(legacyApiKey),
            apiKeyPrefix: medic.apiKeyPrefix || legacyApiKey.slice(0, 10),
            apiKeyLastRotatedAt: medic.apiKeyLastRotatedAt || new Date().toISOString(),
        });

        return updatedMedic;
    }

    async createPasswordResetRequest(email) {
        if (!email) {
            throw createHttpError('Email is required', 400);
        }

        const medic = await this.getMedicByEmail(email);
        if (!medic) {
            return { accepted: true };
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
        const tokenHash = this.hashResetSecret(rawToken);
        const codeHash = this.hashResetSecret(verificationCode);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        const resetUrlBase = process.env.PASSWORD_RESET_URL || 'http://localhost:5173/reset-password';
        const resetUrl = `${resetUrlBase}?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`;

        await this.medicRepository.savePasswordResetState(medic.id, {
            passwordResetTokenHash: tokenHash,
            passwordResetCodeHash: codeHash,
            passwordResetExpiresAt: expiresAt,
        });

        await this.emailService.sendPasswordResetEmail({
            to: email,
            resetUrl,
            code: verificationCode,
            expiresInMinutes: 15,
        });

        return { accepted: true };
    }

    async resetPassword({ email, token, code, newPassword }) {
        if (!email || !newPassword || (!token && !code)) {
            throw createHttpError('email, newPassword and token or code are required', 400);
        }

        if (newPassword.length < 8) {
            throw createHttpError('password must be at least 8 characters long', 400);
        }

        const medic = await this.getMedicByEmail(email);
        if (!medic) {
            throw createHttpError('Invalid or expired reset request', 400);
        }

        const isExpired = !medic.passwordResetExpiresAt || new Date(medic.passwordResetExpiresAt).getTime() < Date.now();
        if (isExpired) {
            throw createHttpError('Invalid or expired reset request', 400);
        }

        const tokenValid = token && medic.passwordResetTokenHash === this.hashResetSecret(token);
        const codeValid = code && medic.passwordResetCodeHash === this.hashResetSecret(code);

        if (!tokenValid && !codeValid) {
            throw createHttpError('Invalid or expired reset request', 400);
        }

        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash(newPassword, 10);

        await this.medicRepository.updateMedic(medic.id, {
            ...medic,
            passwordHash,
            passwordResetTokenHash: null,
            passwordResetCodeHash: null,
            passwordResetExpiresAt: null,
        });

        return { reset: true };
    }

    async changePassword({ medicId, currentPassword, newPassword }) {
        if (!medicId || !currentPassword || !newPassword) {
            throw createHttpError('medicId, currentPassword and newPassword are required', 400);
        }

        if (newPassword.length < 8) {
            throw createHttpError('password must be at least 8 characters long', 400);
        }

        const medic = await this.getMedic(medicId);
        if (!medic || !medic.passwordHash) {
            throw createHttpError('Account password is not configured', 400);
        }

        const bcrypt = require('bcryptjs');
        const matches = await bcrypt.compare(currentPassword, medic.passwordHash);
        if (!matches) {
            throw createHttpError('Current password is incorrect', 401);
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.medicRepository.updateMedic(medic.id, {
            ...medic,
            passwordHash,
        });

        return { changed: true };
    }

    hashResetSecret(value) {
        return crypto.createHash('sha256').update(String(value)).digest('hex');
    }
}

module.exports = MedicService;
