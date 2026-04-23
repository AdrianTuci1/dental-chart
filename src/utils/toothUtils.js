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
    const quadrant = Math.floor(n / 10);
    return [1, 2, 5, 6].includes(quadrant);
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

export const getPrimaryCounterpart = (permanentNumber) => {
    const n = parseInt(permanentNumber);
    const quadrant = Math.floor(n / 10);
    const index = n % 10;

    // Only anterior + premolar have primary counterparts (index 1 to 5)
    if (index > 5) return null;

    if (quadrant === 1) return 50 + index;
    if (quadrant === 2) return 60 + index;
    if (quadrant === 3) return 70 + index;
    if (quadrant === 4) return 80 + index;

    return null; // Already primary or invalid
};

export const getPermanentCounterpart = (primaryNumber) => {
    const n = parseInt(primaryNumber);
    const quadrant = Math.floor(n / 10);
    const index = n % 10;

    if (quadrant === 5) return 10 + index;
    if (quadrant === 6) return 20 + index;
    if (quadrant === 7) return 30 + index;
    if (quadrant === 8) return 40 + index;

    return null; // Already permanent or invalid
};

export const generateDentitionByAge = (dateOfBirth) => {
    if (!dateOfBirth) return {};

    const teeth = {};
    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age >= 12) return {}; // Fully adult

    const quadrants = [1, 2, 3, 4];
    const setPrimary = (index) => {
        quadrants.forEach(q => {
            const num = q * 10 + index;
            // Only indices 1-5 can be primary
            if (index >= 1 && index <= 5) {
                teeth[num] = { developmentState: 'baby tooth' };
            }
        });
    };

    if (age < 6) {
        // All front + premolar positions are baby teeth
        for (let i = 1; i <= 5; i++) setPrimary(i);
    } else if (age >= 6 && age < 9) {
        // Mixed early: 6s emerge (adult). Central incisors (1s) usually adult by 7-8.
        // Lateral incisors (2s) adult by 8-9. Let's keep 3, 4, 5 as baby teeth.
        // To be safe for an 8 year old: 1s are adult, 2s might be adult, 3-5 are baby.
        for (let i = 2; i <= 5; i++) setPrimary(i);
        if (age >= 8) {
            // Let's say by 8, lateral incisors are also adult, so remove them from baby set.
            quadrants.forEach(q => delete teeth[q * 10 + 2]);
        }
    } else if (age >= 9 && age <= 11) {
        // Mixed late: Canines and premolars replace.
        // Let's just keep 5s (second molars) as baby teeth for 9-10.
        for (let i = 4; i <= 5; i++) setPrimary(i);
        if (age >= 10) {
            quadrants.forEach(q => delete teeth[q * 10 + 4]); // 4s become adult
        }
    }

    // Molars development logic (6, 7, 8)
    // 8s (Third molars) -> not developed before 17
    // 7s (Second molars) -> not developed before 12
    // 6s (First molars) -> not developed before 6
    const setMolarStatus = (index, status) => {
        quadrants.forEach(q => {
            teeth[q * 10 + index] = { developmentState: status };
        });
    };

    if (age < 17) setMolarStatus(8, 'not yet developed');
    if (age < 12) setMolarStatus(7, 'not yet developed');
    if (age < 6) setMolarStatus(6, 'not yet developed');

    return teeth;
};

export const resolveDentition = (teeth = {}) => {
    const result = {};

    const resolveSlot = (permanentNum) => {
        const primaryNum = getPrimaryCounterpart(permanentNum);

        // No primary counterpart (molars 6-8)
        if (!primaryNum) {
            return {
                displayNumber: permanentNum,
                toothData: teeth[permanentNum]
            };
        }

        const permData = teeth[permanentNum];
        const primaryData = teeth[primaryNum];

        // Case 1: Permanent slot explicitly marked as 'baby tooth'
        if (permData && (permData.developmentState === 'baby tooth' || permData.developmentState === 'baby tooth missing')) {
            return {
                displayNumber: primaryNum,
                toothData: { ...permData, ...(primaryData || {}) }
            };
        }

        // Case 2: Primary tooth has its own data
        if (primaryData && Object.keys(primaryData).length > 0) {
            if (primaryData.developmentState === 'adult tooth') {
                return {
                    displayNumber: permanentNum,
                    toothData: permData
                };
            }
            if (primaryData.pathology || primaryData.restoration || primaryData.endodontic) {
                return {
                    displayNumber: primaryNum,
                    toothData: primaryData
                };
            }
        }

        // Default: render as permanent
        return {
            displayNumber: permanentNum,
            toothData: permData
        };
    };

    const allPermanent = [
        18, 17, 16, 15, 14, 13, 12, 11,
        21, 22, 23, 24, 25, 26, 27, 28,
        48, 47, 46, 45, 44, 43, 42, 41,
        31, 32, 33, 34, 35, 36, 37, 38
    ];

    allPermanent.forEach(num => {
        result[num] = resolveSlot(num);
    });

    return result;
};

// --- Mapping Utility for Tooth Model to Renderer ---
import { ToothZone, Material } from '../models/DentalModels.js';
import { mapEndoConditions } from './endoUtils';

export const getToothType = (toothNumber) => {
    const n = parseInt(toothNumber);
    const index = n % 10;

    if (index === 1 || index === 2 || index === 3) return 'anterior';
    if (index === 4 || index === 5) return 'premolar';
    if (index >= 6) return 'molar';
    return 'molar';
};

/**
 * Returns all zones covered by a full-coverage restoration (Implant, Pontic, Full Crown)
 * based on the tooth type.
 */
export const getFullCoverageZones = (toothNumber) => {
    const type = getToothType(toothNumber);
    if (type === 'anterior') {
        return [
            ToothZone.MESIAL,
            ToothZone.DISTAL,
            ToothZone.BUCCAL,
            ToothZone.PALATAL,
            ToothZone.OCCLUSAL // Maps to Incisal in anterior
        ];
    }
    if (type === 'premolar') {
        return [
            ToothZone.MESIAL,
            ToothZone.DISTAL,
            'Buccal Cusp',
            'Lingual Cusp',
            'Buccal Surf',
            'Palatal Surf',
            ToothZone.OCCLUSAL
        ];
    }
    // Molar
    return [
        ToothZone.MESIAL,
        ToothZone.DISTAL,
        ToothZone.MESIO_BUCCAL_CUSP,
        ToothZone.DISTO_BUCCAL_CUSP,
        ToothZone.MESIO_PALATAL_CUSP,
        ToothZone.DISTO_PALATAL_CUSP,
        'Buccal Surf',
        'Palatal Surf',
        ToothZone.OCCLUSAL
    ];
};

export const mapToothDataToConditions = (tooth, historicalDate = null, treatments = []) => {
    if (!tooth) {
        // Even if there's no tooth data (historical), we might have treatment plan items
        // affecting the visual state (like endo masks)
        tooth = { number: null };
    }

    const isBeforeOrAtHistoricalDate = (item) => {
        if (!historicalDate) return true; // Show everything in current view

        // If passing just a date string (e.g. missingDate)
        if (typeof item === 'string') {
            return new Date(item) <= new Date(historicalDate);
        }

        // If it's a rich object
        if (!item) return true;
        // User requested that masks should appear on teeth regardless of history if they are planned/monitoring
        if (item.status === 'planned' || item.status === 'monitoring') return true;
        if (!item.date) return true; // Show legacy items unconditionally
        return new Date(item.date) <= new Date(historicalDate);
    };

    // Determine tooth category (Anterior / Premolar / Molar)
    const toothNum = tooth.number || tooth.toothNumber || tooth.isoNumber;
    const type = getToothType(toothNum);
    const isAnterior = type === 'anterior';

    const conditions = [];

    // Check for Implant, Pontic or Missing first — endo is irrelevant for these teeth
    const hasImplantOrPontic = tooth.restoration && tooth.restoration.crowns && tooth.restoration.crowns.some(c =>
        (c.base === 'Implant' || c.type === 'Pontic' || c.crownType === 'Pontic') && isBeforeOrAtHistoricalDate(c)
    );
    const isMissingTooth = tooth.isMissing && isBeforeOrAtHistoricalDate(tooth.missingDate);

    // If the tooth is missing and has no structure (implant/pontic), don't draw any masks
    if (isMissingTooth && !hasImplantOrPontic) {
        return [];
    }

    // --- Map Endodontic Treatments (only for natural teeth or those with structure) ---
    if (!hasImplantOrPontic) {
        mapEndoConditions(tooth, isBeforeOrAtHistoricalDate, treatments, conditions);
    }

    // Map Fractures (Only if natural tooth / not implant/pontic)
    if (!hasImplantOrPontic && tooth.pathology && tooth.pathology.fracture && isBeforeOrAtHistoricalDate(tooth.pathology.fracture)) {
        if (tooth.pathology.fracture.crown) {
            const dir = typeof tooth.pathology.fracture.crown === 'string' ? tooth.pathology.fracture.crown.toLowerCase() : 'horizontal';
            conditions.push({
                surface: `fracture_crown_${dir}`,
                zone: `Fracture Crown-${dir}`,
                color: '#FF0000',
                type: 'fracture',
                stroke: '#FF0000',
                strokeWidth: 1.5,
                opacity: 0.9
            });
        }
        if (tooth.pathology.fracture.root) {
            const dir = typeof tooth.pathology.fracture.root === 'string' ? tooth.pathology.fracture.root.toLowerCase() : 'horizontal';
            conditions.push({
                surface: `fracture_root_${dir}`,
                zone: `Fracture Root-${dir}`,
                color: '#FF0000',
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

        // Premolars/Other custom cusps often use standard 'buccal cusp' / 'lingual cusp'
        'Buccal Cusp': 'buccal cusp',
        'Lingual Cusp': 'lingual cusp',

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

    const pushZoneConditions = (items = []) => {
        items.filter(entry => isBeforeOrAtHistoricalDate(entry)).forEach(entry => {
            // IF it's an implant or pontic, use full coverage zones regardless of entry.zones
            const isFullCoverage = entry.base === 'Implant' || entry.type === 'Pontic' || entry.crownType === 'Pontic';
            const zonesToMap = isFullCoverage ? getFullCoverageZones(toothNum) : (entry.zones || []);

            if (!zonesToMap || !Array.isArray(zonesToMap)) {
                return;
            }

            zonesToMap.forEach(zone => {
                let surface = zoneMap[zone];

                if (!surface && typeof zone === 'string') {
                    surface = zone;
                }

                if (surface) {
                    const baseColor = materialColorMap[entry.material] || '#3B82F6';
                    conditions.push({
                        surface,
                        zone,
                        color: baseColor,
                        opacity: 0.9,
                        type: 'restoration'
                    });
                }
            });
        });
    };

    // Map Pathology (Decay)
    if (tooth.pathology && tooth.pathology.decay) {
        tooth.pathology.decay.filter(d => isBeforeOrAtHistoricalDate(d)).forEach(decay => {
            if (decay.zones && Array.isArray(decay.zones)) {
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
                        conditions.push({
                            surface: surface,
                            zone: zone, // Preserve original zone
                            color: baseColor,
                            opacity: 0.8,
                            type: 'decay'
                        });
                    }
                });
            }
        });
    }

    // Map Restorations (Fillings)
    if (tooth.restoration && tooth.restoration.fillings) {
        pushZoneConditions(tooth.restoration.fillings);
    }

    // Map Crowns
    if (tooth.restoration && tooth.restoration.crowns) {
        pushZoneConditions(tooth.restoration.crowns);
    }

    // Map Advanced Restorations (Inlay, Onlay, Partial Crown)
    if (tooth.restoration && tooth.restoration.advancedRestorations) {
        pushZoneConditions(tooth.restoration.advancedRestorations);
    }

    // Map Veneers
    if (tooth.restoration && tooth.restoration.veneers) {
        pushZoneConditions(tooth.restoration.veneers);
    }

    // Map Tooth Wear (Abrasion & Erosion)
    if (tooth.pathology && tooth.pathology.toothWear && tooth.pathology.toothWear.type) {
        const wear = tooth.pathology.toothWear;
        const surface = (wear.surface || '').toLowerCase();
        const WEAR_COLOR = '#888888'; // Grey for tooth wear

        if (wear.type === 'Abrasion') {
            // Abrasion: cervical band — buccal side if Buccal, lingual/palatal if Lingual/Palatal
            if (surface === 'buccal') {
                conditions.push({ zone: 'Abrasion Buccal', surface: 'Abrasion Buccal', color: WEAR_COLOR, opacity: 0.8, type: 'wear' });
            } else {
                conditions.push({ zone: 'Abrasion Lingual', surface: 'Abrasion Lingual', color: WEAR_COLOR, opacity: 0.8, type: 'wear' });
                conditions.push({ zone: 'Abrasion Palatal', surface: 'Abrasion Palatal', color: WEAR_COLOR, opacity: 0.8, type: 'wear' });
            }
        }

        if (wear.type === 'Erosion') {
            // Erosion: full buccal or palatal surface with hatching
            if (surface === 'buccal') {
                conditions.push({ zone: 'Erosion Buccal', surface: 'Erosion Buccal', color: WEAR_COLOR, opacity: 0.8, type: 'wear' });
            } else {
                conditions.push({ zone: 'Erosion Lingual', surface: 'Erosion Lingual', color: WEAR_COLOR, opacity: 0.8, type: 'wear' });
                conditions.push({ zone: 'Erosion Palatal', surface: 'Erosion Palatal', color: WEAR_COLOR, opacity: 0.8, type: 'wear' });
            }
        }
    }

    // Map Apical Pathology
    if (tooth.pathology && tooth.pathology.apicalPathology && isBeforeOrAtHistoricalDate(tooth.pathology.apicalPathology)) {
        conditions.push({
            type: 'apical',
            color: '#EF4444', // Red for pathology
            opacity: 1.0
        });
    }

    // Deduplicate by zone: last condition added for a given zone wins.
    // This ensures a newer restoration fully covers any older mask on the same surface.
    const zoneMap2 = new Map();
    conditions.forEach((cond, i) => {
        if (cond.zone) zoneMap2.set(cond.zone, i);
    });
    const deduped = conditions.filter((cond, i) =>
        !cond.zone || zoneMap2.get(cond.zone) === i
    );

    return deduped;
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
    let baseUrl = toothImagesData.convention?.baseDirectory || '/assets/teeth/';

    // If primary tooth (quadrants 5-8), use the deciduous assets folder
    const quadrant = Math.floor(toothNum / 10);
    if (quadrant >= 5 && quadrant <= 8 && convCondition !== 'missing') {
        baseUrl = '/assets/decidous/';
    }

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
export const getToothCondition = (tooth, historicalDate = null) => {
    if (!tooth) return 'withRoots';
    const developmentState = tooth.developmentState?.toLowerCase();

    const isBeforeOrAtHistoricalDate = (item) => {
        if (!historicalDate) return true; // Show everything in current view

        // If passing just a date string (e.g. missingDate)
        if (typeof item === 'string') {
            return new Date(item) <= new Date(historicalDate);
        }

        // If it's a rich object
        if (!item) return true;
        if (item.status === 'planned' || item.status === 'monitoring') return true;
        if (!item.date) return true; // Show legacy items unconditionally
        return new Date(item.date) <= new Date(historicalDate);
    };

    if (developmentState === 'not yet developed') return 'notYetDeveloped';

    // 1. Check for Restorations (Crowns/Implants/Pontics) FIRST
    // If a tooth is missing BUT replaced by an implant or pontic, we want to see the replacement
    if (tooth.restoration && tooth.restoration.crowns && tooth.restoration.crowns.length > 0) {
        const crowns = tooth.restoration.crowns.filter(c => isBeforeOrAtHistoricalDate(c));
        if (crowns.length > 0) {
            // Check for Implant supported crown
            const hasImplant = crowns.some(c => c.base === 'Implant');
            if (hasImplant) return 'implant';

            // Check for Pontic
            const hasPontic = crowns.some(c => c.type === 'Pontic' || c.crownType === 'Pontic');
            if (hasPontic) return 'crown'; // Use crown image for pontics

            return 'crown';
        }
    }

    if (developmentState === 'baby tooth missing' || developmentState === 'adult tooth missing') {
        return 'missing';
    }

    // 2. Check for Missing
    if (tooth.isMissing && isBeforeOrAtHistoricalDate(tooth.missingDate)) return 'missing';

    return 'withRoots';
};
