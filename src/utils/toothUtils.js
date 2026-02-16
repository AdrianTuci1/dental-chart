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

export const getToothType = (toothNumber) => {
    const n = parseInt(toothNumber);
    const index = n % 10;

    if (index === 1 || index === 2 || index === 3) return 'anterior';
    if (index === 4 || index === 5) return 'premolar';
    if (index >= 6) return 'molar';
    return 'molar';
};

export const mapToothDataToConditions = (tooth) => {
    if (!tooth) return [];

    // Determine tooth category (Anterior / Premolar / Molar)
    const type = getToothType(tooth.number);
    const isAnterior = type === 'anterior';

    const conditions = [];

    // Check for Implant or Pontic (to exclude fractures)
    const hasImplantOrPontic = tooth.restoration && tooth.restoration.crowns && tooth.restoration.crowns.some(c =>
        c.base === 'Implant' || c.type === 'Pontic'
    );

    // Map Fractures (Only if natural tooth / not implant/pontic)
    if (!hasImplantOrPontic && tooth.pathology && tooth.pathology.fracture) {
        if (tooth.pathology.fracture.crown) {
            conditions.push({
                surface: `fracture_crown_${tooth.pathology.fracture.crown.toLowerCase()}`,
                zone: 'Fracture Crown',
                color: 'transparent',
                type: 'fracture',
                stroke: '#FF0000',
                strokeWidth: 1.5,
                opacity: 0.9
            });
        }
        if (tooth.pathology.fracture.root) {
            conditions.push({
                surface: `fracture_root_${tooth.pathology.fracture.root.toLowerCase()}`,
                zone: 'Fracture Root',
                color: 'transparent',
                type: 'fracture',
                stroke: '#FF0000',
                strokeWidth: 1.5,
                opacity: 0.9
            });
        }
    }

    // Base Zone Mapping
    const zoneMap = {
        [ToothZone.OCCLUSAL]: isAnterior ? 'incisal' : 'occlusal',
        [ToothZone.INCISAL]: 'incisal',
        [ToothZone.MESIAL]: 'mesial',
        [ToothZone.DISTAL]: 'distal',
        // Map general buccal/palatal to 'surface' to trigger full-area highlighting
        // Specific cusps (if provided in data) will override this if handled separately
        [ToothZone.BUCCAL]: 'surface',
        [ToothZone.PALATAL]: 'surface',
        [ToothZone.LINGUAL]: 'surface',

        [ToothZone.CERVICAL_BUCCAL]: 'cervical buccal',
        [ToothZone.CERVICAL_PALATAL]: 'cervical palatal',

        // Molar specific cusps
        [ToothZone.MESIO_BUCCAL_CUSP]: 'mesio-buccal cusp',
        [ToothZone.DISTO_BUCCAL_CUSP]: 'disto-buccal cusp',
        [ToothZone.MESIO_PALATAL_CUSP]: 'mesio-palatal cusp',
        [ToothZone.DISTO_PALATAL_CUSP]: 'disto-palatal cusp',
        [ToothZone.APICAL]: 'root',

        'Class 4 Mesial': 'class4_mesial', // Future proofing
        'Class 4 Distal': 'class4_distal'
    };

    const materialColorMap = {
        [Material.COMPOSITE]: '#3bc7f6ff', // Blue
        [Material.CERAMIC]: '#c72ef1ff', // White/Gray
        [Material.GOLD]: '#F59E0B', // Gold
        [Material.NON_PRECIOUS]: '#7f8ebbff' // Dark Gray
    };

    // Specific colors for Anterior zones (requested by User)
    const COLOR_RED_POINT = '#8C0D0D';
    const COLOR_BLUE_CLASS4 = '#0D5B8C';
    const COLOR_GREEN_INCISAL = '#259E00';
    const COLOR_ORANGE_BODY = '#FF8F0F';

    // Helper to determine color
    const getColor = (zoneKey, baseColor) => {
        if (!isAnterior) return baseColor; // Default for Molars

        // Anterior specific overrides
        if (zoneKey === 'mesial' || zoneKey === 'distal') return COLOR_RED_POINT;
        if (zoneKey === 'incisal') return COLOR_GREEN_INCISAL;
        if (zoneKey === 'class4_mesial' || zoneKey === 'class4_distal') return COLOR_BLUE_CLASS4;
        if (zoneKey === 'surface') return COLOR_ORANGE_BODY; // Buccal/Palatal surface

        return baseColor;
    };

    // Map Restorations (Fillings)
    if (tooth.restoration && tooth.restoration.fillings) {
        tooth.restoration.fillings.forEach(filling => {
            filling.zones.forEach(zone => {
                let surface = zoneMap[zone];
                // Fallback for direct string matches if enum fails
                // Fallback for direct string matches if enum fails
                if (!surface && typeof zone === 'string') {
                    surface = zone;
                }

                if (surface) {
                    const baseColor = materialColorMap[filling.material] || '#3B82F6';
                    conditions.push({
                        surface: surface,
                        zone: zone, // Preserve original zone for filtering (e.g. Buccal vs Palatal)
                        color: getColor(surface, baseColor),
                        opacity: 0.6
                    });
                }
            });
        });
    }

    // Map Pathology (Decay)
    if (tooth.pathology && tooth.pathology.decay) {
        tooth.pathology.decay.forEach(decay => {
            if (decay.zones) {
                decay.zones.forEach(zone => {
                    // Normalize zone to string if it's an object (though usually strings here)
                    const zoneKey = typeof zone === 'string' ? zone : (zone?.id || zone?.value || zone);
                    let surface = zoneMap[zoneKey];

                    // Fallback for dynamic zones (cusps, surfaces) that serve as direct keys
                    if (!surface && typeof zoneKey === 'string') {
                        surface = zoneKey;
                    }

                    if (surface) {
                        const baseColor = '#EF4444'; // Standard Red
                        // For Anterior decay points, we might want the Dark Red Point color too
                        // or keep standard red to differentiate from the "marker"?
                        // User said "punctele rosii mici: mesial si distal". Assuming this refers to the zone representation itself.

                        conditions.push({
                            surface: surface,
                            zone: zone, // Preserve original zone
                            color: getColor(surface, baseColor),
                            opacity: 0.6
                        });
                    }
                });
            }
        });
    }

    // Map Apical Pathology
    if (tooth.pathology && tooth.pathology.apicalPathology) {
        conditions.push({
            type: 'apical',
            color: '#EF4444', // Red for pathology
            opacity: 1.0
        });
    }

    return conditions;
};

// --- Tooth Image Loading Utilities ---
import toothImagesData from '../data/toothImages.json';

/**
 * Get the tooth image path based on tooth number, condition, and view
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

    // Special rule: Top view does not have crown/implant images, use standard
    if (convView === 'top' && (convCondition === 'crown' || convCondition === 'implant')) {
        convCondition = 'standard';
    }

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
 */


export const mapViewToImageView = (view, toothNumber) => {
    if (view === 'frontal') {
        return 'buccal';
    } else if (view === 'lingual') {
        return 'lingual';
    } else if (view === 'topview') {
        const type = getToothType(toothNumber);
        if (type === 'anterior') { // Changed from 'incisor'/'canine' to match new type system
            return 'incisal';
        } else {
            return 'occlusal';
        }
    }
    return 'buccal'; // Default
};

/**
 * Get tooth condition from tooth data
 */
export const getToothCondition = (tooth) => {
    if (!tooth) return 'withRoots';

    // 1. Check for Missing
    if (tooth.isMissing) return 'missing';

    // 2. Check for Restorations (Crowns)
    if (tooth.restoration && tooth.restoration.crowns && tooth.restoration.crowns.length > 0) {
        // Evaluate the most significant crown (usually the last one added or just the first one if multiple exist)
        // For simplicity, we check if ANY crown matches the criteria
        const crowns = tooth.restoration.crowns;

        // Check for Implant supported crown
        const hasImplant = crowns.some(c => c.base === 'Implant');
        if (hasImplant) return 'implant';

        // Check for Pontic with Natural base (or just any other crown)
        // User specific request: "Daca avem pontic si natural la restoration ar trebui sa afisam imaginea cu _crown"
        // This generally falls under generic crown
        return 'crown';
    }

    return 'withRoots';
};

