const TreatmentPlanRepository = require('../models/repositories/TreatmentPlanRepository');
const { v4: uuidv4 } = require('uuid');

class TreatmentPlanService {
    constructor() {
        this.treatmentPlanRepository = new TreatmentPlanRepository();
    }

    async addTreatmentPlanItem(patientId, planData) {
        if (!patientId || !planData.tooth || !planData.procedure) {
            throw new Error('Patient ID, tooth number and procedure details are required');
        }

        const newItem = {
            id: planData.id || `tp-${uuidv4().split('-')[0]}`,
            status: planData.status || 'planned',
            ...planData,
        };

        return await this.treatmentPlanRepository.addTreatmentPlanItem(patientId, newItem);
    }

    async getPatientTreatmentPlans(patientId) {
        if (!patientId) {
            throw new Error('Patient ID is required');
        }

        return await this.treatmentPlanRepository.getPatientTreatmentPlans(patientId);
    }
}

module.exports = TreatmentPlanService;
