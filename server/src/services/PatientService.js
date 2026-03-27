const PatientRepository = require('../models/repositories/PatientRepository');
const { v4: uuidv4 } = require('uuid');

class PatientService {
    constructor() {
        this.patientRepository = new PatientRepository();
    }

    async createPatient(patientData) {
        // Validate using camelCase fields (matching frontend convention)
        if (!patientData.medicId || !patientData.fullName) {
            throw new Error('medicId and fullName are required');
        }

        const newPatient = {
            id: patientData.id || uuidv4(),
            ...patientData,
        };

        return await this.patientRepository.createPatient(newPatient);
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
}

module.exports = PatientService;

