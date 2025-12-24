import { Tooth } from './ToothModels';

/**
 * Chart Data Models
 * Extracted from DentalModels.js
 */

export class Chart {
    constructor(patientDOB) {
        this.teeth = {}; // Map of tooth ID (ISO) to Tooth object
        this.initializeTeeth(patientDOB);
    }

    initializeTeeth(dob) {
        // Logic to determine if primary or permanent dentition should be initialized based on age
        // For simplicity, we'll initialize standard permanent teeth (11-18, 21-28, 31-38, 41-48)
        // and primary if needed. 
        // This is a placeholder for the actual ISO initialization logic.
        const permanentTeethISO = [
            18, 17, 16, 15, 14, 13, 12, 11,
            21, 22, 23, 24, 25, 26, 27, 28,
            48, 47, 46, 45, 44, 43, 42, 41,
            31, 32, 33, 34, 35, 36, 37, 38
        ];

        permanentTeethISO.forEach(iso => {
            this.teeth[iso] = new Tooth(iso);
        });
    }
}
