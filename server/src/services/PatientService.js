const PatientRepository = require('../models/repositories/PatientRepository');
const { v4: uuidv4 } = require('uuid');

class PatientService {
    constructor() {
        this.patientRepository = new PatientRepository();
    }

    async createPatient(patientData) {
        // Validate or manipulate data before saving
        if (!patientData.medic_id || !patientData.full_name) {
            throw new Error('medic_id and full_name are required');
        }

        const newPatient = {
            id: uuidv4(),
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

        // Group the single-table design flat list into a structured object
        const patientData = allRecords.find(item => item.SK === 'METADATA#');
        const history = allRecords.filter(item => item.SK.startsWith('HISTORY#'));
        const plans = allRecords.filter(item => item.SK.startsWith('PLAN#'));

        if (!patientData) {
            throw new Error('Patient not found');
        }

        return {
            ...patientData,
            history,
            plans
        };
    }
}

module.exports = PatientService;
