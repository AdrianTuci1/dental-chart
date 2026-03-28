const PatientRepository = require('../models/repositories/PatientRepository');
const HistoryRepository = require('../models/repositories/HistoryRepository');
const TreatmentPlanRepository = require('../models/repositories/TreatmentPlanRepository');
const { v4: uuidv4 } = require('uuid');

class PatientService {
    constructor() {
        this.patientRepository = new PatientRepository();
        this.historyRepository = new HistoryRepository();
        this.treatmentPlanRepository = new TreatmentPlanRepository();
    }

    async createPatient(patientData) {
        // Normalize: accept both fullName and name, standardize to `name`
        const name = patientData.name || patientData.fullName;
        if (!patientData.medicId || !name) {
            throw new Error('medicId and name are required');
        }

        const { fullName: _unusedFullName, ...rest } = patientData; // Strip fullName if present

        const newPatient = {
            id: rest.id || uuidv4(),
            ...rest,
            name, // Standardized field
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
            throw new Error('Patient ID is required');
        }
        return await this.patientRepository.getPatientById(id);
    }

    async getPatientFullRecord(id) {
        if (!id) {
            throw new Error('Patient ID is required');
        }

        // This will fetch Patient metadata, history, and treatment plans all together
        const allRecords = await this.patientRepository.getPatientWithChartAndHistory(id);

        // Extract items from consolidated records
        const patientData = allRecords.find(item => item.SK === 'METADATA#');
        const historyRecord = allRecords.find(item => item.SK === 'HISTORY#');
        const planRecord = allRecords.find(item => item.SK === 'PLAN#');

        if (!patientData) {
            throw new Error('Patient not found');
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
            throw new Error('Medic ID is required');
        }
        return await this.patientRepository.getPatientsByMedicId(medicId);
    }

    async deletePatient(id) {
        if (!id) {
            throw new Error('Patient ID is required');
        }
        return await this.patientRepository.deletePatient(id);
    }

    async updatePatient(id, patientData) {
        if (!id) {
            throw new Error('Patient ID is required');
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
}

module.exports = PatientService;
