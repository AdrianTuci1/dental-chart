import toothImagesData from '../../data/toothImages.json';
import { getBaseToothNumber } from './toothNumbering';
import { getToothType } from './toothConditionMapper';

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
