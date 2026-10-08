import { getBaseToothNumber, shouldMirror } from './toothUtils';
import { staticPath } from './assetPaths';

// This function constructs the path to the tooth image
// Note: In a real app, you might need to import all images or use a dynamic import
// For now, we'll return a path string resolved from public/static at runtime
export const getToothImagePath = (toothNumber, view = 'frontal', state = 'default') => {
    const baseNumber = getBaseToothNumber(toothNumber);
    // Naming convention: iso{toothNumber}-{view}-{state}.png
    // Example: iso11-frontal-default.png
    return staticPath(`teeth/iso${baseNumber}-${view}-${state}.png`);
};

export const getToothImageStyle = (toothNumber) => {
    if (shouldMirror(toothNumber)) {
        return { transform: 'scaleX(-1)' };
    }
    return {};
};
