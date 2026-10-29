const { v4: uuidv4 } = require('uuid');

const TreatmentPlanRepository = require('../infrastructure/TreatmentPlanRepository');
const { BadRequestError } = require('../../../shared/errors/AppError');

/** Planned treatments for one patient, stored as a single ordered array. */
class TreatmentPlanService {
    constructor({
        treatmentPlanRepository = new TreatmentPlanRepository(),
        idGenerator = uuidv4,
    } = {}) {
        this.treatmentPlanRepository = treatmentPlanRepository;
        this.idGenerator = idGenerator;
    }

    async updateTreatmentPlan(patientId, items) {
        if (!patientId || !Array.isArray(items)) {
            throw new BadRequestError('Patient ID and items array are required');
        }

        return this.treatmentPlanRepository.updateTreatmentPlan(patientId, items);
    }

    async addTreatmentPlanItem(patientId, planData) {
        const currentItems = await this.getPatientTreatmentPlans(patientId);
        const newItem = {
            id: planData.id || `tp-${this.idGenerator().split('-')[0]}`,
            status: planData.status || 'planned',
            ...planData,
        };
        currentItems.push(newItem);
        return this.updateTreatmentPlan(patientId, currentItems);
    }

    async getPatientTreatmentPlans(patientId) {
        if (!patientId) {
            throw new BadRequestError('Patient ID is required');
        }

        return this.treatmentPlanRepository.getPatientTreatmentPlans(patientId);
    }
}

module.exports = TreatmentPlanService;
