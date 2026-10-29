/**
 * Tooth Mask Transform Configuration
 * Configure horizontal flip and rotation for each tooth group and view
 * 
 * Edit this configuration to adjust mask transforms without changing code logic
 */

/**
 * Transform Configuration Matrix
 * 
 * tooth group → view → transforms
 * 
 * Available transforms:
 * - horizontalFlip: true (apply flip) | false (no flip) | 'toggle' (invert base flip)
 * - rotation: 0 | 180 (degrees)
 * 
 * Note: Base horizontal flip is ALWAYS applied first for SVG alignment
 *       Use 'toggle' to invert this base flip
 */
export const TOOTH_MASK_TRANSFORMS = {
    // 11-18: Upper Right (Everything OK - base transforms only)
    '11-18': {
        inside: {
            horizontalFlip: true,  // Base flip
            rotation: 0
        },
        topview: {
            horizontalFlip: true,  // Base flip
            rotation: 0
        },
        outside: {
            horizontalFlip: true,  // Base flip
            rotation: 0
        }
    },

    // 21-28: Upper Left (Top view needs flip adjustment)
    '21-28': {
        inside: {
            horizontalFlip: true,  // Base flip
            rotation: 0
        },
        topview: {
            horizontalFlip: 'toggle',  // Invert base flip
            rotation: 0
        },
        outside: {
            horizontalFlip: true,  // Base flip
            rotation: 0
        }
    },

    // 31-38: Lower Left (Top view + Inside view flip, Outside view rotate)
    '31-38': {
        inside: {
            horizontalFlip: 'toggle',  // Invert base flip
            rotation: 0
        },
        topview: {
            horizontalFlip: 'toggle',  // Invert base flip
            rotation: 0
        },
        outside: {
            horizontalFlip: true,  // Invert base flip
            rotation: 180
        }
    },

    // 41-48: Lower Right (Top view + Outside view with rotation)
    '41-48': {
        inside: {
            horizontalFlip: false,  // Base flip
            rotation: 0
        },
        topview: {
            horizontalFlip: 'toggle',  // Invert base flip
            rotation: 0
        },
        outside: {
            horizontalFlip: true,  // Invert base flip
            rotation: 180
        }
    }
};

/**
 * Get mask transforms for a specific tooth and view
 * @param {number} toothNumber - Tooth number (11-48)
 * @param {string} view - View type ('frontal', 'lingual', 'topview')
 * @returns {Object} Transform configuration { needsHorizontalFlip: boolean, needsRotation: boolean }
 */
export const getMaskTransforms = (toothNumber, view) => {
    const tNum = parseInt(toothNumber, 10);

    // Determine tooth group
    let groupKey;
    if (tNum >= 11 && tNum <= 18) groupKey = '11-18';
    else if (tNum >= 21 && tNum <= 28) groupKey = '21-28';
    else if (tNum >= 31 && tNum <= 38) groupKey = '31-38';
    else if (tNum >= 41 && tNum <= 48) groupKey = '41-48';
    else return { needsHorizontalFlip: true, needsRotation: false }; // Fallback

    // Map view names
    const viewKey = view === 'frontal' ? 'outside' : view === 'lingual' ? 'inside' : 'topview';

    // Get config for this tooth group and view
    const config = TOOTH_MASK_TRANSFORMS[groupKey]?.[viewKey];
    if (!config) return { needsHorizontalFlip: true, needsRotation: false }; // Fallback

    // Process horizontal flip
    let needsHorizontalFlip = true; // Base flip
    if (config.horizontalFlip === 'toggle') {
        needsHorizontalFlip = false; // Invert base flip
    } else if (config.horizontalFlip === false) {
        needsHorizontalFlip = false;
    }

    // Process rotation
    const needsRotation = config.rotation === 180;

    return { needsHorizontalFlip, needsRotation };
};
