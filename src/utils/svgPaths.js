export const getToothType = (toothNumber) => {
    const n = parseInt(toothNumber);
    const index = n % 10;

    if (index === 1 || index === 2) return 'incisor';
    if (index === 3) return 'canine';
    if (index === 4 || index === 5) return 'premolar';
    if (index >= 6) return 'molar';
    return 'molar'; // Fallback
};

export const TOOTH_PATHS = {
    molar: {
        topview: {
            O: 'M 30,30 L 70,30 L 70,70 L 30,70 Z',
            M: 'M 10,20 L 30,30 L 30,70 L 10,80 Z',
            D: 'M 70,30 L 90,20 L 90,80 L 70,70 Z',
            B: 'M 30,10 L 70,10 L 70,30 L 30,30 Z',
            L: 'M 30,70 L 70,70 L 70,90 L 30,90 Z'
        },
        frontal: {
            B: 'M 10,30 L 90,30 L 90,120 L 10,120 Z',
            M: 'M 0,30 L 10,30 L 10,120 L 0,120 Z',
            D: 'M 90,30 L 100,30 L 100,120 L 90,120 Z',
            root: 'M 20,120 L 50,190 L 80,120 Z' // Simplified root
        },
        lingual: {
            L: 'M 10,30 L 90,30 L 90,120 L 10,120 Z',
            M: 'M 0,30 L 10,30 L 10,120 L 0,120 Z',
            D: 'M 90,30 L 100,30 L 100,120 L 90,120 Z'
        }
    },
    premolar: {
        topview: {
            O: 'M 35,35 L 65,35 L 65,65 L 35,65 Z',
            M: 'M 15,25 L 35,35 L 35,65 L 15,75 Z',
            D: 'M 65,35 L 85,25 L 85,75 L 65,65 Z',
            B: 'M 35,15 L 65,15 L 65,35 L 35,35 Z',
            L: 'M 35,65 L 65,65 L 65,85 L 35,85 Z'
        },
        frontal: {
            B: 'M 20,30 L 80,30 L 80,110 L 20,110 Z',
            M: 'M 10,30 L 20,30 L 20,110 L 10,110 Z',
            D: 'M 80,30 L 90,30 L 90,110 L 80,110 Z',
            root: 'M 30,110 L 50,180 L 70,110 Z'
        },
        lingual: {
            L: 'M 20,30 L 80,30 L 80,110 L 20,110 Z',
            M: 'M 10,30 L 20,30 L 20,110 L 10,110 Z',
            D: 'M 80,30 L 90,30 L 90,110 L 80,110 Z'
        }
    },
    canine: {
        topview: {
            O: 'M 40,40 L 60,40 L 60,60 L 40,60 Z', // Cusp tip
            M: 'M 20,30 L 40,40 L 40,60 L 20,70 Z',
            D: 'M 60,40 L 80,30 L 80,70 L 60,60 Z',
            B: 'M 40,20 L 60,20 L 60,40 L 40,40 Z',
            L: 'M 40,60 L 60,60 L 60,80 L 40,80 Z'
        },
        frontal: {
            B: 'M 25,30 L 75,30 L 50,120 Z', // Pointed shape
            M: 'M 15,30 L 25,30 L 25,100 L 15,100 Z',
            D: 'M 75,30 L 85,30 L 85,100 L 75,100 Z',
            root: 'M 30,100 L 50,200 L 70,100 Z' // Long root
        },
        lingual: {
            L: 'M 25,30 L 75,30 L 50,120 Z',
            M: 'M 15,30 L 25,30 L 25,100 L 15,100 Z',
            D: 'M 75,30 L 85,30 L 85,100 L 75,100 Z'
        }
    },
    incisor: {
        topview: {
            O: 'M 30,45 L 70,45 L 70,55 L 30,55 Z', // Incisal edge
            M: 'M 10,30 L 30,45 L 30,55 L 10,70 Z',
            D: 'M 70,45 L 90,30 L 90,70 L 70,55 Z',
            B: 'M 30,25 L 70,25 L 70,45 L 30,45 Z',
            L: 'M 30,55 L 70,55 L 70,75 L 30,75 Z'
        },
        frontal: {
            B: 'M 20,30 L 80,30 L 80,110 L 20,110 Z',
            M: 'M 10,30 L 20,30 L 20,110 L 10,110 Z',
            D: 'M 80,30 L 90,30 L 90,110 L 80,110 Z',
            root: 'M 30,110 L 50,170 L 70,110 Z'
        },
        lingual: {
            L: 'M 20,30 L 80,30 L 80,110 L 20,110 Z',
            M: 'M 10,30 L 20,30 L 20,110 L 10,110 Z',
            D: 'M 80,30 L 90,30 L 90,110 L 80,110 Z'
        }
    }
};

export const getSurfacePath = (toothNumber, view, surface) => {
    const type = getToothType(toothNumber);
    return TOOTH_PATHS[type]?.[view]?.[surface] || '';
};
