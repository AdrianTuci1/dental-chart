const TreatmentPlanRepository = require('../models/repositories/TreatmentPlanRepository');
const { v4: uuidv4 } = require('uuid');

class TreatmentPlanService {
    constructor() {
        this.treatmentPlanRepository = new TreatmentPlanRepository();
    }

    async updateTreatmentPlan(patientId, items) {
        if (!patientId || !Array.isArray(items)) {
            throw new Error('Patient ID and items array are required');
        }

        return await this.treatmentPlanRepository.updateTreatmentPlan(patientId, items);
    }

    async addTreatmentPlanItem(patientId, planData) {
        const currentItems = await this.getPatientTreatmentPlans(patientId);
        const newItem = {
            id: planData.id || `tp-${uuidv4().split('-')[0]}`,
            status: planData.status || 'planned',
            ...planData,
        };
        currentItems.push(newItem);
        return await this.updateTreatmentPlan(patientId, currentItems);
    }

    async getPatientTreatmentPlans(patientId) {
        if (!patientId) {
            throw new Error('Patient ID is required');
        }

        return await this.treatmentPlanRepository.getPatientTreatmentPlans(patientId);
    }
}

module.exports = TreatmentPlanService;
