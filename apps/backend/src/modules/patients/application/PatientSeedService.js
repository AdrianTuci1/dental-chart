const { v4: uuidv4 } = require('uuid');

const PatientService = require('./PatientService');
const HistoryService = require('./HistoryService');
const TreatmentPlanService = require('./TreatmentPlanService');
const { MOCK_PATIENTS_TEMPLATES } = require('../infrastructure/mockPatients');

/**
 * Onboarding seed for a new account. It lives in the patients module because it owns
 * patient records; identity only asks for it when an account is created.
 */
class PatientSeedService {
    constructor({
        patientService = new PatientService(),
        historyService = new HistoryService(),
        treatmentPlanService = new TreatmentPlanService(),
        templates = MOCK_PATIENTS_TEMPLATES,
        idGenerator = uuidv4,
    } = {}) {
        this.patientService = patientService;
        this.historyService = historyService;
        this.treatmentPlanService = treatmentPlanService;
        this.templates = templates;
        this.idGenerator = idGenerator;
    }

    async seedForMedic(medicId) {
        for (const template of this.templates) {
            const { history, treatmentPlan, ...patientInfo } = template;

            // Unique ids per medic avoid collisions between seeded accounts.
            const patientId = this.idGenerator();
            const remapId = (oldId) => oldId.replace(/patient-1/g, patientId);

            const createdPatient = await this.patientService.createPatient({
                ...patientInfo,
                id: patientId,
                medicId,
            }, { skipPlanLimit: true });

            if (treatmentPlan?.items) {
                await this.treatmentPlanService.updateTreatmentPlan(
                    createdPatient.id,
                    treatmentPlan.items.map((item) => ({ ...item, id: remapId(item.id) }))
                );
            }

            if (history?.completedItems) {
                await this.historyService.updateHistory(
                    createdPatient.id,
                    history.completedItems.map((item) => ({ ...item, id: remapId(item.id) }))
                );
            }
        }
    }
}

module.exports = PatientSeedService;
