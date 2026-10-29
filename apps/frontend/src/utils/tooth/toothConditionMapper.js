import { ToothZone, Material } from '../../models/DentalModels.js';
import { mapEndoConditions } from '../endoUtils';

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
            // IF it's a crown (Single, Implant, or Pontic), use full coverage zones
            const isFullCoverage = entry.subtype === 'crown' || entry.base === 'Implant' || entry.type === 'Pontic' || entry.crownType === 'Pontic';
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

    // Map Discoloration
    if (tooth.pathology && tooth.pathology.discoloration && isBeforeOrAtHistoricalDate(tooth.pathology.discoloration)) {
        const discol = tooth.pathology.discoloration;
        if (discol.color) {
            const colorVal = discol.color.toLowerCase();
            let tintColor = '#808080'; // gray
            if (colorVal === 'red') tintColor = '#EF4444';
            else if (colorVal === 'yellow') tintColor = '#EAB308';
            else if (colorVal === 'gray') tintColor = '#808080';

            conditions.push({
                surface: 'Whole Tooth',
                zone: 'Whole Tooth',
                color: tintColor,
                opacity: 0.25,
                type: 'discoloration'
            });
        }
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
