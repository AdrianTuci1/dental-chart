const MedicRepository = require('../models/repositories/MedicRepository');
const { v4: uuidv4 } = require('uuid');
const { MOCK_PATIENTS_TEMPLATES } = require('../utils/mockData');

// Import other services to seed data
const PatientService = require('./PatientService');
const HistoryService = require('./HistoryService');
const TreatmentPlanService = require('./TreatmentPlanService');

class MedicService {
    constructor() {
        this.medicRepository = new MedicRepository();
        this.patientService = new PatientService();
        this.historyService = new HistoryService();
        this.treatmentPlanService = new TreatmentPlanService();
    }

    async createMedic(medicData) {
        if (!medicData.name || !medicData.email) {
            throw new Error('Name and email are required');
        }

        const newMedic = {
            id: medicData.id || uuidv4(),
            ...medicData,
        };

        const createdMedic = await this.medicRepository.createMedic(newMedic);

        // Always seed mock data for new medic accounts in this stage
        await this.seedMedicData(newMedic.id);

        return createdMedic;
    }

    async seedMedicData(medicId) {
        for (const patient of MOCK_PATIENTS_TEMPLATES) {
            const { history, treatmentPlan, ...patientInfo } = patient;
            
            // 1. Create Patient (stripping the template ID so a new one is generated if needed, 
            // but PatientService now matches by ID if provided, which is fine for mock-1)
            const createdPatient = await this.patientService.createPatient({
                ...patientInfo,
                medicId: medicId
            });

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
            throw new Error('Medic ID is required');
        }
        return await this.medicRepository.getMedicById(id);
    }

    async getMedicPatients(medicId) {
        return await this.patientService.getPatientsByMedicId(medicId);
    }
}

module.exports = MedicService;
