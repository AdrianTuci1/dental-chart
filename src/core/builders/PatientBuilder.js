import { PatientModel } from '../models/PatientModel';

/**
 * Builder pattern for creating complex Patient objects.
 * Useful when receiving partial data from APIs or creating new entities from scratch.
 */
export class PatientBuilder {
    constructor() {
        this.patientData = {
            id: null,
            name: '',
            treatmentPlan: { items: [] },
            history: { completedItems: [] },
            chart: { teeth: {} }
        };
    }

    withId(id) {
        this.patientData.id = id;
        return this;
    }

    withName(name) {
        this.patientData.name = name;
        return this;
    }

    withTreatmentPlan(items) {
        this.patientData.treatmentPlan = { items: Array.isArray(items) ? items : [] };
        return this;
    }

    withHistory(historyItems) {
        this.patientData.history = { completedItems: Array.isArray(historyItems) ? historyItems : [] };
        return this;
    }

    withChartContext(chartData) {
        this.patientData.chart = chartData || { teeth: {} };
        return this;
    }

    build() {
        if (!this.patientData.id) {
            this.patientData.id = Date.now().toString(); // Generate ID if none provided during creation
        }
        // In a strict typed language, this would return new PatientModel(this.patientData)
        // Since we are using plain objects with static model methods, we return the object.
        return this.patientData;
    }
}
