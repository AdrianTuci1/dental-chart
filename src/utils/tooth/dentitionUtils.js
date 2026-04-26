import { getPrimaryCounterpart } from './toothNumbering';

export const generateDentitionByAge = (dateOfBirth) => {
    if (!dateOfBirth) return {};

    const teeth = {};
    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age >= 12) return {}; // Fully adult

    const quadrants = [1, 2, 3, 4];
    const setPrimary = (index) => {
        quadrants.forEach(q => {
            const num = q * 10 + index;
            // Only indices 1-5 can be primary
            if (index >= 1 && index <= 5) {
                teeth[num] = { developmentState: 'baby tooth' };
            }
        });
    };

    if (age < 6) {
        // All front + premolar positions are baby teeth
        for (let i = 1; i <= 5; i++) setPrimary(i);
    } else if (age >= 6 && age < 9) {
        // Mixed early: 6s emerge (adult). Central incisors (1s) usually adult by 7-8.
        // Lateral incisors (2s) adult by 8-9. Let's keep 3, 4, 5 as baby teeth.
        // To be safe for an 8 year old: 1s are adult, 2s might be adult, 3-5 are baby.
        for (let i = 2; i <= 5; i++) setPrimary(i);
        if (age >= 8) {
            // Let's say by 8, lateral incisors are also adult, so remove them from baby set.
            quadrants.forEach(q => delete teeth[q * 10 + 2]);
        }
    } else if (age >= 9 && age <= 11) {
        // Mixed late: Canines and premolars replace.
        // Let's just keep 5s (second molars) as baby teeth for 9-10.
        for (let i = 4; i <= 5; i++) setPrimary(i);
        if (age >= 10) {
            quadrants.forEach(q => delete teeth[q * 10 + 4]); // 4s become adult
        }
    }

    // Molars development logic (6, 7, 8)
    // 8s (Third molars) -> not developed before 17
    // 7s (Second molars) -> not developed before 12
    // 6s (First molars) -> not developed before 6
    const setMolarStatus = (index, status) => {
        quadrants.forEach(q => {
            teeth[q * 10 + index] = { developmentState: status };
        });
    };

    if (age < 17) setMolarStatus(8, 'not yet developed');
    if (age < 12) setMolarStatus(7, 'not yet developed');
    if (age < 6) setMolarStatus(6, 'not yet developed');

    return teeth;
};

export const resolveDentition = (teeth = {}) => {
    const result = {};

    const resolveSlot = (permanentNum) => {
        const primaryNum = getPrimaryCounterpart(permanentNum);

        // No primary counterpart (molars 6-8)
        if (!primaryNum) {
            return {
                displayNumber: permanentNum,
                toothData: teeth[permanentNum]
            };
        }

        const permData = teeth[permanentNum];
        const primaryData = teeth[primaryNum];

        // Case 1: Permanent slot explicitly marked as 'baby tooth'
        if (permData && (permData.developmentState === 'baby tooth' || permData.developmentState === 'baby tooth missing')) {
            return {
                displayNumber: primaryNum,
                toothData: { ...permData, ...(primaryData || {}) }
            };
        }

        // Case 2: Primary tooth has its own data
        if (primaryData && Object.keys(primaryData).length > 0) {
            if (primaryData.developmentState === 'adult tooth') {
                return {
                    displayNumber: permanentNum,
                    toothData: permData
                };
            }
            if (primaryData.pathology || primaryData.restoration || primaryData.endodontic) {
                return {
                    displayNumber: primaryNum,
                    toothData: primaryData
                };
            }
        }

        // Default: render as permanent
        return {
            displayNumber: permanentNum,
            toothData: permData
        };
    };

    const allPermanent = [
        18, 17, 16, 15, 14, 13, 12, 11,
        21, 22, 23, 24, 25, 26, 27, 28,
        48, 47, 46, 45, 44, 43, 42, 41,
        31, 32, 33, 34, 35, 36, 37, 38
    ];

    allPermanent.forEach(num => {
        result[num] = resolveSlot(num);
    });

    return result;
};
