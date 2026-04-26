const PatientRepository = require('../models/repositories/PatientRepository');
const HistoryRepository = require('../models/repositories/HistoryRepository');
const TreatmentPlanRepository = require('../models/repositories/TreatmentPlanRepository');
const MedicRepository = require('../models/repositories/MedicRepository');
const ClinicService = require('./ClinicService');
const { v4: uuidv4 } = require('uuid');
const { createHttpError } = require('../utils/httpError');

const EXTERNAL_PATIENT_FIELDS = ['id', 'name', 'dateOfBirth', 'gender', 'phone', 'email'];

class PatientService {
    constructor() {
        this.patientRepository = new PatientRepository();
        this.historyRepository = new HistoryRepository();
        this.treatmentPlanRepository = new TreatmentPlanRepository();
        this.medicRepository = new MedicRepository();
        this.clinicService = new ClinicService();
    }

    async createPatient(patientData, options = {}) {
        // Normalize: accept both fullName and name, standardize to `name`
        const name = patientData.name || patientData.fullName;
        if (!patientData.medicId || !name) {
            throw createHttpError('medicId and name are required', 400);
        }

        const medic = await this.medicRepository.getMedicById(patientData.medicId);
        if (!medic) {
            throw createHttpError('Medic not found', 404);
        }

        const isFreePlan = (medic.subscriptionPlan || 'free') === 'free';
        if (isFreePlan && !options.skipPlanLimit) {
            const patientCount = await this.patientRepository.countPatientsByOwnerMedicId(medic.id);
            if (patientCount >= 5) {
                throw createHttpError('Free accounts can only manage up to 5 patients', 403);
            }
        }

        const clinic = await this.clinicService.resolveClinicForMedic(patientData.medicId, patientData.clinicId);
        const { fullName: _unusedFullName, ...rest } = patientData; // Strip fullName if present

        const newPatient = {
            id: rest.id || uuidv4(),
            ...rest,
            name, // Standardized field
            clinicId: clinic.id,
            ownerMedicId: patientData.ownerMedicId || patientData.medicId,
        };

        // Split data if history or treatmentPlan are present (even if empty)
        const { history, treatmentPlan, ...metadata } = newPatient;
        
        await Promise.all([
            this.patientRepository.createPatient(metadata),
            this.historyRepository.updateHistory(newPatient.id, history?.completedItems || []),
            this.treatmentPlanRepository.updateTreatmentPlan(newPatient.id, treatmentPlan?.items || [])
        ]);

        return this.getPatientFullRecord(newPatient.id);
    }

    async getPatient(id) {
        if (!id) {
            throw createHttpError('Patient ID is required', 400);
        }
        return await this.patientRepository.getPatientById(id);
    }

    async getPatientFullRecord(id) {
        if (!id) {
            throw createHttpError('Patient ID is required', 400);
        }

        // This will fetch Patient metadata, history, and treatment plans all together
        const allRecords = await this.patientRepository.getPatientWithChartAndHistory(id);

        // Extract items from consolidated records
        const patientData = allRecords.find(item => item.SK === 'METADATA#');
        const historyRecord = allRecords.find(item => item.SK === 'HISTORY#');
        const planRecord = allRecords.find(item => item.SK === 'PLAN#');

        if (!patientData) {
            throw createHttpError('Patient not found', 404);
        }

        // Return in the same shape as mockData.js (camelCase, nested)
        return {
            ...patientData,
            treatmentPlan: {
                items: planRecord ? (planRecord.items || []) : []
            },
            history: {
                completedItems: historyRecord ? (historyRecord.items || []) : []
            }
        };
    }

    async getPatientsByMedicId(medicId) {
        if (!medicId) {
            throw createHttpError('Medic ID is required', 400);
        }

        const clinics = await this.clinicService.listMedicClinics(medicId);
        const clinicIds = clinics.map((clinic) => clinic.id);
        const [clinicPatients, legacyOwnedPatients] = await Promise.all([
            this.patientRepository.getPatientsByClinicIds(clinicIds),
            this.patientRepository.getPatientsByMedicId(medicId),
        ]);

        const patientMap = new Map();
        [...clinicPatients, ...legacyOwnedPatients].forEach((patient) => {
            patientMap.set(patient.id, patient);
        });

        return Array.from(patientMap.values());
    }

    async deletePatient(id) {
        if (!id) {
            throw createHttpError('Patient ID is required', 400);
        }
        return await this.patientRepository.deletePatient(id);
    }

    async updatePatient(id, patientData) {
        if (!id) {
            throw createHttpError('Patient ID is required', 400);
        }

        // Normalize: accept both fullName and name, standardize to `name`
        if (patientData.fullName && !patientData.name) {
            patientData.name = patientData.fullName;
        }
        delete patientData.fullName; // Always strip fullName
        
        // Split incoming unit-of-work into separate records
        const { history, treatmentPlan, ...incomingMetadata } = patientData;

        // CRITICAL FIX: Fetch existing metadata and merge to prevent data loss during partial updates (like from PatientModal)
        let finalMetadata = incomingMetadata;
        try {
            const existingFull = await this.getPatientFullRecord(id);
            if (existingFull) {
                // Strip items that are managed by separate tables to avoid re-including them in the METADATA# SK
                const { history: _, treatmentPlan: __, ...existingMetadata } = existingFull;
                finalMetadata = { ...existingMetadata, ...incomingMetadata };
                console.log(`[PatientService] Merged incoming data with existing metadata for ${id}`);
            }
        } catch {
            console.log(`[PatientService] No existing patient found for merge during update of ${id}, proceeding with provided data.`);
        }

        const updatePromises = [
            this.patientRepository.updatePatient(id, finalMetadata)
        ];

        if (history && history.completedItems) {
            updatePromises.push(this.historyRepository.updateHistory(id, history.completedItems));
        }

        if (treatmentPlan && treatmentPlan.items) {
            updatePromises.push(this.treatmentPlanRepository.updateTreatmentPlan(id, treatmentPlan.items));
        }

        await Promise.all(updatePromises);

        return this.getPatientFullRecord(id);
    }

    async deletePatientsByOwnerMedicId(ownerMedicId) {
        if (!ownerMedicId) {
            throw createHttpError('ownerMedicId is required', 400);
        }

        await this.patientRepository.deletePatientsByOwnerMedicId(ownerMedicId);
    }

    async deletePatientsByClinicId(clinicId) {
        if (!clinicId) {
            throw createHttpError('clinicId is required', 400);
        }

        await this.patientRepository.deletePatientsByClinicId(clinicId);
    }

    async getPatientsOwnedByMedic(ownerMedicId) {
        return this.patientRepository.getPatientsByOwnerMedicId(ownerMedicId);
    }

    async upsertExternalPatient(medicId, patientPayload) {
        const externalPayload = this._pickExternalFields(patientPayload);
        const name = externalPayload.name || patientPayload.fullName;

        if (!name) {
            throw createHttpError('name is required', 400);
        }

        if (externalPayload.id) {
            const existingPatient = await this.getPatient(externalPayload.id);
            if (!existingPatient) {
                throw createHttpError('Patient not found', 404);
            }

            const canAccess = await this.medicHasAccessToPatient(medicId, existingPatient);
            if (!canAccess) {
                throw createHttpError('Medic does not have access to this patient', 403);
            }

            return this.updatePatient(externalPayload.id, {
                ...externalPayload,
                name,
            });
        }

        return this.createPatient({
            ...externalPayload,
            name,
            medicId,
            lastExamDate: 'N/A',
            treatmentPlan: { items: [] },
            history: { completedItems: [] },
            chart: { teeth: {} },
        });
    }

    async deleteExternalPatient(medicId, patientId) {
        const patient = await this.getPatient(patientId);
        if (!patient) {
            throw createHttpError('Patient not found', 404);
        }

        const canAccess = await this.medicHasAccessToPatient(medicId, patient);
        if (!canAccess) {
            throw createHttpError('Medic does not have access to this patient', 403);
        }

        await this.deletePatient(patientId);
    }

    async medicHasAccessToPatient(medicId, patient) {
        if (!patient) {
            return false;
        }

        if (patient.ownerMedicId === medicId || patient.medicId === medicId) {
            return true;
        }

        if (!patient.clinicId) {
            return false;
        }

        const clinics = await this.clinicService.listMedicClinics(medicId);
        return clinics.some((clinic) => clinic.id === patient.clinicId);
    }

    _pickExternalFields(payload = {}) {
        return EXTERNAL_PATIENT_FIELDS.reduce((acc, field) => {
            if (payload[field] !== undefined) {
                acc[field] = payload[field];
            }
            return acc;
        }, {});
    }
}

module.exports = PatientService;
