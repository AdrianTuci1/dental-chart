import { Chart } from './ChartModels';
import { Gender } from './Enums';

/**
 * Patient Data Models
 * Extracted from DentalModels.js
 */

export class Patient {
    constructor(id, fullName, dateOfBirth, address, gender) {
        this.id = id;
        this.fullName = fullName;
        this.dateOfBirth = dateOfBirth;
        this.address = address;
        this.gender = gender; // Use Gender enum

        this.oralHealth = new OralHealth();
        this.bpe = new BasicPeriodontalExamination();
        this.medicalIssues = new MedicalIssues();
        this.treatmentPlan = new TreatmentPlan();
        this.history = new History();
        this.chart = new Chart(dateOfBirth); // Chart depends on age for primary/permanent teeth
    }
}

export class OralHealth {
    constructor() {
        this.plaqueIndex = 0;
        this.bleedingIndex = 0;
        this.halitosis = false;
    }
}

export class BasicPeriodontalExamination {
    constructor() {
        // Scores: 0-4, or '*'
        this.upperRight = 0;
        this.upperAnterior = 0;
        this.upperLeft = 0;
        this.lowerRight = 0;
        this.lowerAnterior = 0;
        this.lowerLeft = 0;
    }
}

export class MedicalIssues {
    constructor() {
        this.highBloodPressure = false;
        this.asthma = false;
        this.acidReflux = false;
        this.tobaccoUse = false;
        this.alcoholUse = false;
        this.other = [];
    }
}

export class TreatmentPlan {
    constructor() {
        this.items = []; // Array of planned treatments
    }

    addItem(item) {
        this.items.push(item);
    }
}

export class History {
    constructor() {
        this.completedItems = [];
    }

    addCompletedItem(item) {
        this.completedItems.push(item);
    }
}
