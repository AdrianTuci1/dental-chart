export const TOOTH_NUMBERING = {
    permanent: {
        upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
        upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
        lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
        lowerRight: [41, 42, 43, 44, 45, 46, 47, 48]
    },
    deciduous: {
        upperRight: [55, 54, 53, 52, 51],
        upperLeft: [61, 62, 63, 64, 65],
        lowerLeft: [71, 72, 73, 74, 75],
        lowerRight: [81, 82, 83, 84, 85]
    }
};

export const isUpperJaw = (toothNumber) => {
    const n = parseInt(toothNumber);
    return (n >= 11 && n <= 28) || (n >= 51 && n <= 65);
};

export const isLowerJaw = (toothNumber) => !isUpperJaw(toothNumber);

export const getQuadrant = (toothNumber) => {
    const n = parseInt(toothNumber);
    return Math.floor(n / 10);
};

export const shouldMirror = (toothNumber) => {
    const quadrant = getQuadrant(toothNumber);
    // Mirror left quadrants (2, 3, 6, 7) to use right quadrant images
    return [2, 3, 6, 7].includes(quadrant);
};

export const getBaseToothNumber = (toothNumber) => {
    // Returns the corresponding right-side tooth number for a left-side tooth
    // e.g., 21 -> 11, 36 -> 46
    const n = parseInt(toothNumber);
    const quadrant = Math.floor(n / 10);
    const index = n % 10;

    if (quadrant === 2) return 10 + index;
    if (quadrant === 3) return 40 + index;
    if (quadrant === 6) return 50 + index;
    if (quadrant === 7) return 80 + index;

    return n;
};

// --- Mapping Utility for Tooth Model to Renderer ---
import { ToothZone, Material } from '../models/DentalModels.js';

export const mapToothDataToConditions = (tooth) => {
    if (!tooth) return [];
    const conditions = [];

    const zoneMap = {
        [ToothZone.OCCLUSAL]: 'O',
        [ToothZone.MESIAL]: 'M',
        [ToothZone.DISTAL]: 'D',
        [ToothZone.BUCCAL]: 'B',
        [ToothZone.PALATAL]: 'L',
        [ToothZone.CERVICAL_BUCCAL]: 'B', // Map to Buccal for now
        [ToothZone.CERVICAL_PALATAL]: 'L', // Map to Lingual
        // Cusps map to Occlusal or specific areas if SVG supports it. 
        // For now mapping cusps to Occlusal to ensure visibility
        [ToothZone.MESIO_BUCCAL_CUSP]: 'O',
        [ToothZone.DISTO_BUCCAL_CUSP]: 'O',
        [ToothZone.MESIO_PALATAL_CUSP]: 'O',
        [ToothZone.DISTO_PALATAL_CUSP]: 'O',
    };

    const materialColorMap = {
        [Material.COMPOSITE]: '#3B82F6', // Blue
        [Material.CERAMIC]: '#E5E7EB', // White/Gray
        [Material.GOLD]: '#F59E0B', // Gold
        [Material.NON_PRECIOUS]: '#4B5563' // Dark Gray
    };

    // Map Restorations (Fillings)
    if (tooth.restoration && tooth.restoration.fillings) {
        tooth.restoration.fillings.forEach(filling => {
            filling.zones.forEach(zone => {
                const surface = zoneMap[zone];
                if (surface) {
                    conditions.push({
                        surface: surface,
                        color: materialColorMap[filling.material] || '#3B82F6',
                        opacity: 0.8
                    });
                }
            });
        });
    }

    // Map Pathology (Decay)
    if (tooth.pathology && tooth.pathology.decay) {
        tooth.pathology.decay.forEach(decay => {
            decay.zones.forEach(zone => {
                const surface = zoneMap[zone];
                if (surface) {
                    conditions.push({
                        surface: surface,
                        color: '#EF4444', // Red
                        opacity: 0.8
                    });
                }
            });
        });
    }

    return conditions;
};
