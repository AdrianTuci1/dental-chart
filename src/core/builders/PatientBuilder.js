import { PatientModel } from '../models/PatientModel';

/**
 * Builder pattern for creating complex Patient objects.
 * Useful when receiving partial data from APIs or creating new entities from scratch.
 */
export class PatientBuilder {
    constructor() {
        this.patientData = {
            id: null,
            medicId: null,
            name: '',
            email: '',
            phone: '',
            dateOfBirth: '',
            gender: '',
            lastExamDate: 'N/A',
            treatmentPlan: { items: [] },
            history: { completedItems: [] },
            chart: { teeth: {} },
            oralHealth: {},
            bpe: {},
            medicalIssues: {},
            softTissue: {}
        };
    }

    withId(id) {
        this.patientData.id = id;
        return this;
    }

    withMedicId(medicId) {
        this.patientData.medicId = medicId;
        return this;
    }

    withName(name) {
        this.patientData.name = name;
        return this;
    }

    withEmail(email) {
        this.patientData.email = email;
        return this;
    }

    withPhone(phone) {
        this.patientData.phone = phone;
        return this;
    }

    withDateOfBirth(dob) {
        this.patientData.dateOfBirth = dob;
        return this;
    }

    withGender(gender) {
        this.patientData.gender = gender;
        return this;
    }

    withLastExamDate(date) {
        this.patientData.lastExamDate = date;
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

    withOralHealth(data) {
        this.patientData.oralHealth = data || {};
        return this;
    }

    withBPE(data) {
        this.patientData.bpe = data || {};
        return this;
    }

    withMedicalIssues(data) {
        this.patientData.medicalIssues = data || {};
        return this;
    }

    withSoftTissue(data) {
        this.patientData.softTissue = data || {};
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
