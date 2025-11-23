/**
 * Dental Data Models
 * Implements the data structure for the dental charting application using OOP principles.
 */

// --- Enums & Constants ---

export const Gender = Object.freeze({
    MALE: 'Male',
    FEMALE: 'Female',
    OTHER: 'Other'
});

export const ToothZone = Object.freeze({
    CERVICAL_BUCCAL: 'Cervical Buccal',
    BUCCAL: 'Buccal',
    OCCLUSAL: 'Occlusal',
    DISTAL: 'Distal',
    MESIAL: 'Mesial',
    PALATAL: 'Palatal',
    CERVICAL_PALATAL: 'Cervical Palatal',
    MESIO_BUCCAL_CUSP: 'Mesio Buccal Cusp',
    DISTO_BUCCAL_CUSP: 'Disto Buccal Cusp',
    MESIO_PALATAL_CUSP: 'Mesio Palatal Cusp',
    DISTO_PALATAL_CUSP: 'Disto Palatal Cusp'
});

export const Material = Object.freeze({
    COMPOSITE: 'Composite',
    CERAMIC: 'Ceramic',
    GOLD: 'Gold',
    NON_PRECIOUS: 'Non-Precious'
});

export const Quality = Object.freeze({
    SUFFICIENT: 'Sufficient',
    UNCERTAIN: 'Uncertain',
    INSUFFICIENT: 'Insufficient'
});

export const CrownType = Object.freeze({
    SINGLE: 'Single',
    ABUTMENT: 'Abutment',
    PONTIC: 'Pontic'
});

export const CrownBase = Object.freeze({
    NATURAL: 'Natural',
    IMPLANT: 'Implant'
});

export const Mobility = Object.freeze({
    CLASS_1: 'Class 1',
    CLASS_2: 'Class 2',
    CLASS_3: 'Class 3'
});

export const Furcation = Object.freeze({
    STAGE_1: 'Stage 1',
    STAGE_2: 'Stage 2',
    STAGE_3: 'Stage 3'
});

export const ActionType = Object.freeze({
    MONITOR: 'Monitor',
    TREAT: 'Treat',
    SAVE: 'Save',
    DONE: 'Done'
});

// Pathology Options Configuration
export const PathologyOptions = Object.freeze({
    DECAY: {
        id: 'decay',
        label: 'Decay',
        steps: [
            {
                id: 'material',
                label: 'Material',
                options: [
                    { id: 'dentin', label: 'Dentin', value: 'dentin' },
                    { id: 'enamel', label: 'Enamel', value: 'enamel' }
                ]
            },
            {
                id: 'cavitation',
                label: 'Cavitation',
                options: [
                    { id: 'cavitation', label: 'Cavitation', value: 'cavitation' },
                    { id: 'no-cavitation', label: 'No Cavitation', value: 'no-cavitation' }
                ]
            },
            {
                id: 'level',
                label: 'Level',
                options: [
                    { id: 'c1', label: 'C1', value: 'C1' },
                    { id: 'c2', label: 'C2', value: 'C2' },
                    { id: 'c3', label: 'C3', value: 'C3' },
                    { id: 'c4', label: 'C4', value: 'C4' }
                ]
            }
        ]
    },
    FRACTURE: {
        id: 'fracture',
        label: 'Fracture',
        steps: [
            {
                id: 'location',
                label: 'Location',
                options: [
                    { id: 'crown', label: 'Crown', value: 'crown' },
                    { id: 'root', label: 'Root', value: 'root' }
                ]
            },
            {
                id: 'direction',
                label: 'Direction',
                dependsOn: 'root', // Only show if 'root' is selected in previous step
                options: [
                    { id: 'vertical', label: 'Vertical', value: 'vertical' },
                    { id: 'horizontal', label: 'Horizontal', value: 'horizontal' }
                ]
            }
        ]
    },
    TOOTH_WEAR: {
        id: 'tooth-wear',
        label: 'Tooth Wear',
        steps: [
            {
                id: 'type',
                label: 'Type',
                options: [
                    { id: 'abrasion', label: 'Abrasion', value: 'abrasion' },
                    { id: 'erosion', label: 'Erosion', value: 'erosion' }
                ]
            },
            {
                id: 'surface',
                label: 'Surface',
                options: [
                    { id: 'buccal', label: 'Buccal', value: 'buccal' },
                    { id: 'lingual', label: 'Lingual', value: 'lingual' }
                ]
            }
        ]
    },
    DISCOLORATION: {
        id: 'discoloration',
        label: 'Discoloration',
        steps: [
            {
                id: 'color',
                label: 'Color',
                options: [
                    { id: 'gray', label: 'Gray', value: 'gray' },
                    { id: 'red', label: 'Red', value: 'red' },
                    { id: 'yellow', label: 'Yellow', value: 'yellow' }
                ]
            }
        ]
    },
    APICAL: {
        id: 'apical',
        label: 'Apical',
        steps: [
            {
                id: 'present',
                label: 'Apical Pathology',
                options: [
                    { id: 'yes', label: 'Yes', value: true },
                    { id: 'no', label: 'No', value: false }
                ]
            }
        ]
    },
    DEVELOPMENT_DISORDER: {
        id: 'development-disorder',
        label: 'Development Disorder',
        steps: [
            {
                id: 'present',
                label: 'Development Disorder',
                options: [
                    { id: 'yes', label: 'Yes', value: true },
                    { id: 'no', label: 'No', value: false }
                ]
            }
        ]
    }
});

// Restoration Options Configuration
export const RestorationOptions = Object.freeze({
    FILLING: {
        id: 'filling',
        label: 'Filling',
        steps: [
            {
                id: 'material',
                label: 'Material',
                options: [
                    { id: 'composite', label: 'Composite', value: 'Composite' },
                    { id: 'ceramic', label: 'Ceramic', value: 'Ceramic' },
                    { id: 'gold', label: 'Gold', value: 'Gold' },
                    { id: 'non-precious', label: 'Non-Precious Metal', value: 'Non-Precious' }
                ]
            },
            {
                id: 'quality',
                label: 'Quality',
                options: [
                    { id: 'sufficient', label: 'Sufficient', value: 'Sufficient' },
                    { id: 'uncertain', label: 'Uncertain', value: 'Uncertain' },
                    { id: 'insufficient', label: 'Insufficient', value: 'Insufficient' }
                ]
            }
        ]
    },
    VENEER: {
        id: 'veneer',
        label: 'Veneer',
        steps: [
            {
                id: 'material',
                label: 'Material',
                options: [
                    { id: 'composite', label: 'Composite', value: 'Composite' },
                    { id: 'ceramic', label: 'Ceramic', value: 'Ceramic' },
                    { id: 'gold', label: 'Gold', value: 'Gold' },
                    { id: 'non-precious', label: 'Non-Precious Metal', value: 'Non-Precious' }
                ]
            },
            {
                id: 'quality',
                label: 'Quality',
                options: [
                    { id: 'sufficient', label: 'Sufficient', value: 'Sufficient' },
                    { id: 'uncertain', label: 'Uncertain', value: 'Uncertain' },
                    { id: 'insufficient', label: 'Insufficient', value: 'Insufficient' }
                ]
            },
            {
                id: 'detail',
                label: 'Detail',
                options: [
                    { id: 'overhang', label: 'Overhang', value: 'Overhang' },
                    { id: 'flush', label: 'Flush', value: 'Flush' },
                    { id: 'shortfall', label: 'Shortfall', value: 'Shortfall' }
                ]
            }
        ]
    },
    CROWN: {
        id: 'crown',
        label: 'Crown',
        steps: [
            {
                id: 'material',
                label: 'Material',
                options: [
                    { id: 'composite', label: 'Composite', value: 'Composite' },
                    { id: 'ceramic', label: 'Ceramic', value: 'Ceramic' },
                    { id: 'gold', label: 'Gold', value: 'Gold' },
                    { id: 'non-precious', label: 'Non-Precious Metal', value: 'Non-Precious' }
                ]
            },
            {
                id: 'crownType',
                label: 'Crown Type',
                options: [
                    { id: 'single', label: 'Single Crown', value: 'Single' },
                    { id: 'abutment', label: 'Abutment', value: 'Abutment' },
                    { id: 'pontic', label: 'Pontic', value: 'Pontic' }
                ]
            },
            {
                id: 'crownBase',
                label: 'Crown Base',
                options: [
                    { id: 'natural', label: 'Natural', value: 'Natural' },
                    { id: 'implant', label: 'Implant', value: 'Implant' }
                ]
            },
            {
                id: 'implantType',
                label: 'Implant Type',
                dependsOn: 'implant', // Only show if 'implant' is selected in previous step
                options: [
                    { id: 'bone-level', label: 'Bone Level', value: 'Bone Level' },
                    { id: 'tissue-level', label: 'Tissue Level', value: 'Tissue Level' }
                ]
            }
        ]
    }
});

// --- Classes ---

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

export class Tooth {
    constructor(isoNumber) {
        this.isoNumber = isoNumber;
        this.isMissing = false;
        this.toBeExtracted = false;

        this.endodontic = new Endodontic();
        this.periodontal = new PeriodontalProbing();
        this.pathology = new Pathology();
        this.restoration = new Restoration();
    }

    // Alias for compatibility with existing code that uses toothNumber
    get toothNumber() {
        return this.isoNumber;
    }

    reset() {
        this.isMissing = false;
        this.toBeExtracted = false;
        this.endodontic = new Endodontic();
        this.periodontal = new PeriodontalProbing();
        this.pathology = new Pathology();
        this.restoration = new Restoration();
    }

    get conditions() {
        const conditions = [];

        // Helper to map ToothZone to surface code
        const mapZoneToSurface = (zone) => {
            if (zone.includes('Buccal')) return 'B';
            if (zone.includes('Occlusal')) return 'O';
            if (zone.includes('Distal')) return 'D';
            if (zone.includes('Mesial')) return 'M';
            if (zone.includes('Palatal') || zone.includes('Lingual')) return 'L';
            return null;
        };

        // Map Pathology (Decay)
        if (this.pathology && this.pathology.decay) {
            this.pathology.decay.forEach(decay => {
                decay.zones.forEach(zone => {
                    const surface = mapZoneToSurface(zone);
                    if (surface) {
                        conditions.push({
                            surface: surface,
                            color: '#FF4444', // Red for decay
                            type: 'decay'
                        });
                    }
                });
            });
        }

        // Map Restorations
        if (this.restoration) {
            const restorationTypes = ['fillings', 'inlays', 'onlays', 'partialCrowns'];
            restorationTypes.forEach(type => {
                if (this.restoration[type]) {
                    this.restoration[type].forEach(item => {
                        item.zones.forEach(zone => {
                            const surface = mapZoneToSurface(zone);
                            if (surface) {
                                conditions.push({
                                    surface: surface,
                                    color: '#3B82F6', // Blue for restorations
                                    type: 'restoration'
                                });
                            }
                        });
                    });
                }
            });

            // Crowns (cover all surfaces)
            if (this.restoration.crowns && this.restoration.crowns.length > 0) {
                ['B', 'O', 'M', 'D', 'L'].forEach(surface => {
                    conditions.push({
                        surface: surface,
                        color: '#F59E0B', // Amber/Gold for crowns
                        type: 'crown',
                        opacity: 0.5
                    });
                });
            }
        }

        // Missing / To Be Extracted
        if (this.isMissing) {
            ['B', 'O', 'M', 'D', 'L'].forEach(surface => {
                conditions.push({
                    surface: surface,
                    color: '#E5E7EB', // Gray
                    opacity: 0.9,
                    type: 'missing'
                });
            });
        }

        return conditions;
    }
}

export class Endodontic {
    constructor() {
        this.cold = null; // Options specific to test
        this.percussion = null;
        this.palpitation = null;
        this.heat = null;
        this.electricity = null;
    }
}

export class PeriodontalProbing {
    constructor() {
        // 6 sites per tooth
        this.sites = {
            distoPalatal: new ProbingSite(),
            palatal: new ProbingSite(),
            mesioPalatal: new ProbingSite(),
            distoBuccal: new ProbingSite(),
            buccal: new ProbingSite(),
            mesioBuccal: new ProbingSite()
        };
        this.mobility = null; // Class 1, 2, 3
        this.furcation = null; // Stage 1, 2, 3
    }
}

export class ProbingSite {
    constructor() {
        this.probingDepth = 0; // 0-12
        this.gingivalMargin = 0; // 0-12
        this.bleeding = false;
        this.plaque = false;
        this.pus = false;
        this.tartar = false;
    }
}

export class Pathology {
    constructor() {
        this.fracture = {
            crown: false,
            root: null // 'Vertical', 'Horizontal', or null
        };
        this.toothWear = {
            type: null, // 'Abrasion', 'Erosion'
            surface: null // 'Buccal', 'Palatal'
        };
        this.discoloration = null; // 'Gray', 'Red', 'Yellow'
        this.apicalPathology = false;
        this.developmentDisorder = false;
        this.decay = []; // Array of Decay objects
    }

    addDecay(decay) {
        this.decay.push(decay);
    }
}

export class Decay {
    constructor(type, zones) {
        this.type = type; // 'Dentin', 'Enamel' -> 'Cavitated', 'No Cavitation' -> C1-C4
        this.zones = zones; // Array of ToothZone
    }
}

export class Restoration {
    constructor() {
        this.fillings = [];
        this.inlays = [];
        this.onlays = [];
        this.partialCrowns = [];
        this.crowns = [];
    }

    addFilling(zones, material, quality) {
        this.fillings.push({ zones, material, quality });
    }

    addInlay(zones, material, quality) {
        // Validate zones: Mesial, Occlusal, Distal only
        this.inlays.push({ zones, material, quality });
    }

    addOnlay(zones, material, quality) {
        // Validate zones: Mesial, Distal only
        this.onlays.push({ zones, material, quality });
    }

    addPartialCrown(zones, material, quality) {
        // Validate zones: Mesial, Occlusal, Distal, 4 Cusps
        this.partialCrowns.push({ zones, material, quality });
    }

    addCrown(material, quality, type, base) {
        this.crowns.push({ material, quality, type, base });
    }

    // Action methods
    handleAction(action, item) {
        if (action === ActionType.MONITOR || action === ActionType.TREAT) {
            // Add to Treatment Plan
            // Logic to be connected with Patient.treatmentPlan
            return { addToPlan: true, item };
        } else if (action === ActionType.DONE) {
            // Add to History
            return { addToHistory: true, item };
        }
    }
}
