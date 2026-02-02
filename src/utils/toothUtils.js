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
    // e.g., 21 -> 11, 41 -> 31
    const n = parseInt(toothNumber);
    const quadrant = Math.floor(n / 10);
    const index = n % 10;

    if (quadrant === 2) return 10 + index; // Upper left -> Upper right
    if (quadrant === 3) return 40 + index; // Lower left -> Lower right
    if (quadrant === 6) return 50 + index; // Deciduous upper left -> upper right
    if (quadrant === 7) return 80 + index; // Deciduous lower left -> lower right

    return n;
};

// --- Mapping Utility for Tooth Model to Renderer ---
import { ToothZone, Material } from '../models/DentalModels.js';

export const mapToothDataToConditions = (tooth) => {
    if (!tooth) return [];
    const conditions = [];

    const zoneMap = {
        [ToothZone.OCCLUSAL]: 'occlusal',
        [ToothZone.MESIAL]: 'mesial',
        [ToothZone.DISTAL]: 'distal',
        [ToothZone.BUCCAL]: 'buccal',
        [ToothZone.PALATAL]: 'palatal',
        [ToothZone.LINGUAL]: 'lingual', // Ensure LINGUAL maps if present in enum
        [ToothZone.CERVICAL_BUCCAL]: 'cervical buccal',
        [ToothZone.CERVICAL_PALATAL]: 'cervical palatal',
        [ToothZone.MESIO_BUCCAL_CUSP]: 'buccal cusp', // Mapping cusp to specific zone
        [ToothZone.DISTO_BUCCAL_CUSP]: 'buccal cusp', // Simplified mapping
        [ToothZone.MESIO_PALATAL_CUSP]: 'palatal cusp',
        [ToothZone.DISTO_PALATAL_CUSP]: 'palatal cusp',
        'Buccal Surface': 'buccal surface', // Handle potential string inputs if any
        'Palatal Surface': 'palatal surface'
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

// --- Tooth Image Loading Utilities ---
import toothImagesData from '../data/toothImages.json';

/**
 * Get the tooth image path based on tooth number, condition, and view
 * @param {number|string} toothNumber - ISO tooth number (11-18, 21-28, etc.)
 * @param {string} condition - Tooth condition: 'withRoots', 'withoutRoots', 'missing', 'implant'
 * @param {string} view - View type: 'buccal', 'lingual', 'incisal', 'occlusal'
 * @returns {string|null} - Image path or null if not found
 */
export const getToothImage = (toothNumber, condition = 'withRoots', view = 'buccal') => {
    const toothNum = parseInt(toothNumber);
    const baseToothNum = getBaseToothNumber(toothNum);

    // Map view to convention (outside, inside, top)
    let convView = 'outside';
    if (view === 'buccal' || view === 'labial') convView = 'outside';
    else if (view === 'lingual' || view === 'palatal') convView = 'inside';
    else if (view === 'incisal' || view === 'occlusal') convView = 'top';

    // Map condition to convention
    let convCondition = 'standard';
    if (condition === 'missing') convCondition = 'missing';
    else if (condition === 'implant') convCondition = 'implant';
    else if (condition === 'crown') convCondition = 'crown';
    // condition 'withRoots' maps to 'standard'

    const pattern = toothImagesData.convention?.namingPattern || '{toothNumber}_{view}_{condition}.png';
    const baseUrl = toothImagesData.convention?.baseDirectory || '/assets/teeth/';

    const filename = pattern
        .replace('{toothNumber}', baseToothNum)
        .replace('{view}', convView)
        .replace('{condition}', convCondition);

    return `${baseUrl}${filename}`;
};

/**
 * Map view names from component to JSON format
 * @param {string} view - Component view: 'frontal', 'lingual', 'topview'
 * @param {number} toothNumber - ISO tooth number
 * @returns {string} - JSON view name: 'buccal', 'lingual', 'incisal', 'occlusal'
 */
export const getToothType = (toothNumber) => {
    const n = parseInt(toothNumber);
    const index = n % 10;

    if (index >= 1 && index <= 2) return 'incisor';
    if (index === 3) return 'canine';
    if (index >= 4 && index <= 5) {
        // Deciduous molars are 4 and 5
        if (n >= 51) return 'molar';
        return 'premolar';
    }
    if (index >= 6 && index <= 8) return 'molar';
    return 'unknown';
};

export const mapViewToImageView = (view, toothNumber) => {
    if (view === 'frontal') {
        return 'buccal';
    } else if (view === 'lingual') {
        return 'lingual';
    } else if (view === 'topview') {
        // Our simplified convention maps both incisal and occlusal to 'top', 
        // but we return the specific terms for the code to map to 'top' in getToothImage if needed,
        // or we can just return 'occlusal'/'incisal' to keep compatibility with other parts.
        // The getToothImage function above handles both 'incisal' and 'occlusal' -> 'top'.

        const type = getToothType(toothNumber);
        if (type === 'incisor' || type === 'canine') {
            return 'incisal';
        } else {
            return 'occlusal';
        }
    }
    return 'buccal'; // Default
};

/**
 * Get tooth condition from tooth data
 * @param {object} tooth - Tooth data object
 * @returns {string} - Condition: 'withRoots', 'withoutRoots', 'missing', 'implant'
 */
export const getToothCondition = (tooth) => {
    if (!tooth) return 'withRoots';

    if (tooth.status === 'missing') return 'missing';
    if (tooth.restoration?.type === 'implant') return 'implant';
    if (tooth.restoration?.type === 'crown') return 'crown';

    // Default to withRoots for now
    // You can add more logic here based on your data model
    return 'withRoots';
};
