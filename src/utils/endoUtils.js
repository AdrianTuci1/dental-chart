export const ENDO_CATEGORIES = {
    RCT: 'RCT',
    TREAT: 'Treat',
    OBSERVE: 'Observe'
};

export const ENDO_COLORS = {
    [ENDO_CATEGORIES.RCT]: 'rgba(59, 130, 246, 0.7)',     // Blue
    [ENDO_CATEGORIES.TREAT]: 'rgba(239, 68, 68, 0.7)',   // Red
    [ENDO_CATEGORIES.OBSERVE]: 'rgba(245, 158, 11, 0.7)' // Yellow
};

/**
 * Returns the endo asset name based on tooth number and view.
 */
export const getEndoAssetName = (toothNumber, view) => {
    const tNum = parseInt(toothNumber, 10);
    const index = tNum % 10;
    const isUpper = (tNum >= 11 && tNum <= 28) || (tNum >= 51 && tNum <= 65);

    // Normalize view for asset selection (frontal vs lingual)
    const suffix = (view === 'lingual') ? 'inside' : 'outside';

    if (isUpper) {
        // Upper Molars
        if (index === 6 || index === 7) return `endo-16-26-${suffix}.svg`;
        if (index === 8) return `endo-18-28-${suffix}.svg`;
        // Upper Incisors
        if (index >= 1 && index <= 3) return `endo-upper-incisors.svg`;
        // Upper Premolars
        if (index === 4 || index === 5) return `endo-upper-premolars.svg`;
    } else {
        // Lower Molars
        if (index === 6 || index === 7) return `endo-46-36.svg`;
        if (index === 8) return `endo-48-38.svg`;
        // Lower Incisors
        if (index >= 1 && index <= 3) return `endo-lower-incisors.svg`;
        // Lower Premolars
        if (index === 4 || index === 5) return `endo-lower-premolars.svg`;
    }

    return null;
};

/**
 * Maps endodontic treatments and historical data to chart conditions.
 * @param {Object} tooth - Tooth data
 * @param {Function} isBeforeOrAtHistoricalDate - Helper to check dates
 * @param {Array} treatments - Treatment plan items
 * @param {Array} conditions - The array to push mapped conditions into
 */
export const mapEndoConditions = (tooth, isBeforeOrAtHistoricalDate, treatments, conditions) => {
    // --- Map Endodontic Treatments ---
    if (treatments && treatments.length > 0) {
        treatments.forEach(item => {
            if (item.type === 'endodontic' && isBeforeOrAtHistoricalDate(item)) {
                // Determine category based on procedure or a specific field
                let category = ENDO_CATEGORIES.OBSERVE; // Default
                const proc = (item.procedure || '').toUpperCase();

                if (proc.includes('RCT') || proc.includes('ROOT CANAL') || proc.includes('EXTIRPARE')) {
                    category = ENDO_CATEGORIES.RCT;
                } else if (proc.includes('TREAT') || proc.includes('TRATAMENT') || proc.includes('CARIE profunda')) {
                    category = ENDO_CATEGORIES.TREAT;
                } else if (proc.includes('OBSERVE') || proc.includes('SUPRAVEGHERE')) {
                    category = ENDO_CATEGORIES.OBSERVE;
                } else if (item.category) {
                    category = item.category;
                }

                conditions.push({
                    zone: 'Endo',
                    surface: 'Endo', // Used as fallback / identifier
                    color: ENDO_COLORS[category] || ENDO_COLORS[ENDO_CATEGORIES.OBSERVE],
                    opacity: 0.7,
                    type: 'endodontic'
                });
            }
        });
    }

    // --- Map Historical Endodontic (Completed) ---
    if (tooth.endodontic?.hasRootCanal) {
        // If not already added by treatment plan (planned RCT)
        if (!conditions.some(c => c.zone === 'Endo' && c.color === ENDO_COLORS[ENDO_CATEGORIES.RCT])) {
            conditions.push({
                zone: 'Endo',
                surface: 'Endo',
                color: ENDO_COLORS[ENDO_CATEGORIES.RCT],
                opacity: 0.7,
                type: 'endodontic'
            });
        }
    }
};

/**
 * Calculates the final transforms for endodontic masks, overriding base transforms.
 * 
 * @param {number} toothNumber 
 * @param {string} view ('frontal', 'lingual', 'topview')
 * @param {Object} baseTransforms { needsHorizontalFlip, needsRotation }
 * @returns {Object} { useHorizontalFlip, useVerticalFlip, useRotation }
 */
export const getEndoTransforms = (toothNumber, view, baseTransforms) => {
    const tNum = parseInt(toothNumber, 10);
    const { needsHorizontalFlip, needsRotation } = baseTransforms;
    const isUpperJaw = (tNum >= 11 && tNum <= 28) || (tNum >= 51 && tNum <= 65);

    // Start from the base transforms (same as non-endo conditions)
    let useHorizontalFlip = needsHorizontalFlip;
    let useVerticalFlip = (isUpperJaw && view === 'lingual');
    let useRotation = needsRotation;

    if (isUpperJaw) {
        if (view === 'frontal') {
            useHorizontalFlip = !needsHorizontalFlip;
        } else if (view === 'lingual') {
            useVerticalFlip = !useVerticalFlip;
            useHorizontalFlip = !needsHorizontalFlip;
        }
    } else {
        // Lower jaw
        if (view === 'frontal') {
            useVerticalFlip = true;
            if (tNum >= 41 && tNum <= 48) {
                useHorizontalFlip = !needsHorizontalFlip;
            }
        } else if (view === 'lingual') {
            // Lower jaw inside view: apply horizontal flip
            useHorizontalFlip = false;
        }
    }

    return { useHorizontalFlip, useVerticalFlip, useRotation };
};
