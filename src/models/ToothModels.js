import { ActionType } from './Enums';

/**
 * Tooth Data Models
 * Extracted from DentalModels.js
 */

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
            if (zone === 'Class 4 Mesial') return 'class4_mesial';
            if (zone === 'Class 4 Distal') return 'class4_distal';
            if (zone.includes('Buccal')) return 'buccal';
            if (zone.includes('Occlusal')) return 'occlusal';
            if (zone.includes('Distal')) return 'distal';
            if (zone.includes('Mesial')) return 'mesial';
            if (zone.includes('Palatal') || zone.includes('Lingual')) return 'palatal';
            if (zone.includes('Apical')) return 'root';
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
                            zone: zone,
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
                                    zone: zone,
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
                ['buccal', 'occlusal', 'mesial', 'distal', 'palatal'].forEach(surface => {
                    conditions.push({
                        surface: surface,
                        zone: 'Crown', // Generic zone for crown covering all
                        color: '#F59E0B', // Amber/Gold for crowns
                        type: 'crown',
                        opacity: 0.5
                    });
                });
            }
        }

        // Missing / To Be Extracted
        if (this.isMissing) {
            ['buccal', 'occlusal', 'mesial', 'distal', 'palatal'].forEach(surface => {
                conditions.push({
                    surface: surface,
                    zone: 'Missing',
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
        this.veneers = [];
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

    addVeneer(material, quality, detail) {
        this.veneers.push({ material, quality, detail });
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
