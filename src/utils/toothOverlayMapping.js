import { ToothZone } from '../models/Enums';
import { getEndoAssetName } from './endoUtils';

// Base paths are now handled directly in the getOverlayPath function using new URL(..., import.meta.url)

// Define the file mappings for each category
// Keys match the Zone IDs used in ToothZones.jsx

const INCISOR_MAP = {
    [ToothZone.CERVICAL_BUCCAL]: 'cervical-buccal.svg',
    [ToothZone.BUCCAL]: 'incisor-buccal.svg', // Static buccal
    [ToothZone.MESIAL]: 'incisor-mesial.svg',
    [ToothZone.OCCLUSAL]: 'incisor-incisal.svg',
    [ToothZone.DISTAL]: 'incisor-distal.svg',
    [ToothZone.PALATAL]: 'incisal-palatal.svg', // Static palatal
    [ToothZone.CERVICAL_PALATAL]: 'cervical-palatal.svg',
    // Dynamic zones
    'Class 4 Mesial': 'incisor-class4-mesial.svg',
    'Class 4 Distal': 'incisor-class4-distal.svg',
    'Buccal Surf': 'buccal-surface.svg',
    'Palatal Surf': 'palatal-surface.svg'
};

const PREMOLAR_MAP = {
    // Static zones
    [ToothZone.BUCCAL]: 'molar-buccal.svg',
    [ToothZone.MESIAL]: 'molar-mesial.svg',
    [ToothZone.OCCLUSAL]: 'molar-occlusal.svg',
    [ToothZone.DISTAL]: 'molar-distal.svg',
    [ToothZone.PALATAL]: 'molar-palatal.svg',
    // Dynamic zones
    'Buccal Cusp': 'molar-buccal-cusp.svg',
    'Lingual Cusp': 'molar-palatal-cusp.svg',
    'buccal cusp': 'molar-buccal-cusp.svg',
    'lingual cusp': 'molar-palatal-cusp.svg',
    'Buccal Surf': 'molar-buccal-surface.svg',
    'Lingual Surf': 'molar-palatal-surface.svg'
};

const MOLAR_OVERRIDES = {
    // Dynamic
    [ToothZone.MESIO_BUCCAL_CUSP]: 'mesio-buccal-cusp.svg',
    [ToothZone.DISTO_BUCCAL_CUSP]: 'disto-buccal-cusp.svg',
    [ToothZone.MESIO_PALATAL_CUSP]: 'mesio-palatal-cusp.svg',
    [ToothZone.DISTO_PALATAL_CUSP]: 'disto-palatal-cusp.svg',

    // Static Overrides
    [ToothZone.BUCCAL]: 'buccal.svg', // overrides molar-buccal.svg
    [ToothZone.PALATAL]: 'palatal.svg' // overrides molar-palatal.svg
};

/**
 * Pre-load all overlay image assets using Vite's import.meta.glob for production bundling
 */
const overlayAssets = import.meta.glob('../assets/overlays/**/*.svg', { eager: true, import: 'default' });

const getOverlayAsset = (relativePath) => {
    const fullKey = `../assets/overlays/${relativePath}`;
    return overlayAssets[fullKey] || null;
};

/**
 * Resolves the overlay path for a given tooth and zone/condition.
 */
export const getOverlayPath = (toothNumber, zoneId, view = 'frontal') => {
    const tNum = parseInt(toothNumber, 10);
    const index = tNum % 10;

    // Handle Endo Zones
    if (zoneId === 'Endo') {
        const endoFile = getEndoAssetName(toothNumber, view);
        return endoFile ? getOverlayAsset(`endo/${endoFile}`) : null;
    }

    // Incisors (1, 2, 3)
    if (index >= 1 && index <= 3) {
        const file = INCISOR_MAP[zoneId];
        return file ? getOverlayAsset(`incisors/${file}`) : null;
    }

    // Shared Cervical Overlays for Premolars and Molars (Use Incisor assets)
    if (index >= 4 && index <= 8) {
        if (zoneId === ToothZone.CERVICAL_BUCCAL || zoneId === ToothZone.CERVICAL_PALATAL) {
            const file = INCISOR_MAP[zoneId];
            return file ? getOverlayAsset(`incisors/${file}`) : null;
        }
    }

    // Premolars (4, 5)
    if (index === 4 || index === 5) {
        const file = PREMOLAR_MAP[zoneId];
        return file ? getOverlayAsset(`pre-molars/${file}`) : null;
    }

    // Molars (6, 7, 8)
    if (index >= 6 && index <= 8) {
        // Check override first
        if (MOLAR_OVERRIDES[zoneId]) {
            return getOverlayAsset(`molars/${MOLAR_OVERRIDES[zoneId]}`);
        }
        // Fallback to Premolars
        const file = PREMOLAR_MAP[zoneId];
        return file ? getOverlayAsset(`pre-molars/${file}`) : null;
    }

    return null;
};

/**
 * Returns the source Y offset and height for the given view in the overlay column.
 * Layout: Outside (Frontal) -> Top -> Inside (Lingual)
 * Spacing: 22px
 */
export const getOverlaySlice = (view, zoneId) => {
    // Special case: Endo assets are NOT stacked, they are individual files per view
    if (zoneId === 'Endo') {
        if (view === 'topview') return { y: 0, h: 0 }; // Endo masks usually don't have topview
        return { y: 0, h: 172 };
    }

    // Dimensions provided by user
    // Outside (Frontal): 54x172px
    // Top (Occlusal): 54x94px
    // Inside (Lingual): 54x172px
    // Gap: 22px
    const H_FRONTAL = 172;
    const H_TOP = 94;
    const H_LINGUAL = 172;
    const GAP = 22;

    if (view === 'frontal') { // Outside
        return { y: 0, h: H_FRONTAL };
    }
    if (view === 'topview') { // Top
        return { y: H_FRONTAL + GAP, h: H_TOP };
    }
    if (view === 'lingual') { // Inside
        return { y: H_FRONTAL + GAP + H_TOP + GAP, h: H_LINGUAL };
    }
    return { y: 0, h: 0 };
};
