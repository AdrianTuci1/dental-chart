/**
 * Apical Circle Coordinates Configuration
 * Box size: 48x160
 * Coordinates are [x, y] where 0 <= x <= 48 and 0 <= y <= 160
 * Teeth defined: 11-18 (Upper Right) and 41-48 (Lower Right)
 * Logic for 21-28 and 31-38 is handled by horizontal flip.
 * 
 * Y Coordinates are defined for the OUTSIDE (FRONTAL) view.
 * - Upper Jaw (11-18): Roots are at the top (low Y, e.g., 20-40).
 * - Lower Jaw (41-48): Roots are at the bottom (high Y, e.g., 120-140).
 * 
 * The rendering logic handles flipping these coordinates for the INSIDE (LINGUAL) view.
 */
export const APICAL_COORDINATES = {
    // Upper Right (Roots at Top -> Low Y)
    18: [{ x: 24, y: 30 }, { x: 18, y: 30 }, { x: 10, y: 32 }],
    17: [{ x: 8, y: 30 }, { x: 30, y: 30 }, { x: 20, y: 25 }],
    16: [{ x: 8, y: 20 }, { x: 30, y: 18 }, { x: 22, y: 10 }], // Palatal root + Buccal roots approx
    15: [{ x: 16, y: 14 }],
    14: [{ x: 17, y: 7 }],
    13: [{ x: 14, y: 3 }], // Canine long root
    12: [{ x: 14, y: 35 }],
    11: [{ x: 17, y: 22 }],

    // Lower Right (Roots at Bottom -> High Y)
    41: [{ x: 22, y: 35 }],
    42: [{ x: 10, y: 30 }],
    43: [{ x: 24, y: 15 }], // Canine long root
    44: [{ x: 20, y: 5 }],
    45: [{ x: 10, y: 5 }],
    46: [{ x: 10, y: 7 }, { x: 34, y: 10 }],
    47: [{ x: 18, y: 25 }, { x: 2, y: 28 }],
    48: [{ x: 15, y: 40 }, { x: 33, y: 40 }]
};

export const getApicalCoordinates = (toothNumber) => {
    let tNum = parseInt(toothNumber, 10);

    // Map Quadrant 2 (21-28) to Quadrant 1 (11-18)
    if (tNum >= 21 && tNum <= 28) {
        tNum -= 10;
    }

    // Map Quadrant 3 (31-38) to Quadrant 4 (41-48)
    if (tNum >= 31 && tNum <= 38) {
        tNum += 10;
    }

    return APICAL_COORDINATES[tNum] || [];
};
