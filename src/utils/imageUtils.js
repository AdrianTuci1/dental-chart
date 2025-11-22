import { getBaseToothNumber, shouldMirror } from './toothUtils';

// This function constructs the path to the tooth image
// Note: In a real app, you might need to import all images or use a dynamic import
// For now, we'll return a path string assuming images are in public/teeth or src/assets/teeth
export const getToothImagePath = (toothNumber, view = 'frontal', state = 'default') => {
    const baseNumber = getBaseToothNumber(toothNumber);
    // Naming convention: iso{toothNumber}-{view}-{state}.png
    // Example: iso11-frontal-default.png
    return `/assets/teeth/iso${baseNumber}-${view}-${state}.png`;
};

export const getToothImageStyle = (toothNumber) => {
    if (shouldMirror(toothNumber)) {
        return { transform: 'scaleX(-1)' };
    }
    return {};
};
