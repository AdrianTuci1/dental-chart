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
