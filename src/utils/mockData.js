import { Patient, Gender, Tooth, ToothZone, Material, Quality, ActionType } from '../models/DentalModels.js';

export const MOCK_PATIENTS = [
    new Patient(
        '1',
        'John Doe',
        '1980-05-15',
        '123 Main St, Anytown, CA 12345, USA',
        Gender.MALE
    ),
    new Patient(
        '2',
        'Jane Smith',
        '1992-08-22',
        '456 Oak Ave, Somewhere, NY 67890, USA',
        Gender.FEMALE
    )
];

// Initialize mock medical history and other data for patients
MOCK_PATIENTS[0].medicalIssues.highBloodPressure = true;
MOCK_PATIENTS[0].medicalIssues.other = ['Anxious about dental procedures'];
MOCK_PATIENTS[0].email = 'john.doe@example.com'; // Add extra properties if needed by UI but not in constructor
MOCK_PATIENTS[0].phone = '555-0123';
MOCK_PATIENTS[0].lastExamDate = '2024-10-01';

MOCK_PATIENTS[1].medicalIssues.other = ['No significant medical history'];
MOCK_PATIENTS[1].email = 'jane.smith@example.com';
MOCK_PATIENTS[1].phone = '555-0456';
MOCK_PATIENTS[1].lastExamDate = '2024-11-15';


export const generateMockTeeth = () => {
    const teeth = {};
    const allTeeth = [
        18, 17, 16, 15, 14, 13, 12, 11,
        21, 22, 23, 24, 25, 26, 27, 28,
        31, 32, 33, 34, 35, 36, 37, 38,
        41, 42, 43, 44, 45, 46, 47, 48
    ];

    allTeeth.forEach(num => {
        teeth[num] = new Tooth(num);
    });

    // --- ANTERIOR TEST CASES ---

    // 11 (Central Incisor)
    // Verify: Mesial/Distal Red Points, Incisal Green Band, Cervical
    teeth[11].pathology.addDecay([ToothZone.MESIAL]); // Red Point
    teeth[11].pathology.addDecay([ToothZone.DISTAL]); // Red Point
    teeth[11].restoration.addFilling([ToothZone.INCISAL], Material.COMPOSITE); // Green Band
    teeth[11].restoration.addFilling([ToothZone.CERVICAL_BUCCAL], Material.CERAMIC); // Cervical Arc

    // 12 (Lateral Incisor)
    // Verify: Class 4 Ellipses (Blue), Palatal Body (Orange)
    teeth[12].restoration.addFilling(['Class 4 Mesial'], Material.COMPOSITE); // Blue Ellipse
    teeth[12].restoration.addFilling(['Class 4 Distal'], Material.COMPOSITE); // Blue Ellipse
    teeth[12].restoration.addFilling([ToothZone.PALATAL], Material.GOLD); // Orange Body

    // 13 (Canine)
    teeth[13].restoration.addFilling([ToothZone.CERVICAL_PALATAL], Material.COMPOSITE);

    // --- MOLAR TEST CASES ---

    // 16 (First Molar)
    // Verify: Complex SVG Occlusal, Individual Cusps
    teeth[16].restoration.addFilling([ToothZone.OCCLUSAL], Material.AMALGAM);
    teeth[16].restoration.addFilling([ToothZone.MESIO_BUCCAL_CUSP], Material.COMPOSITE);
    teeth[16].restoration.addFilling([ToothZone.DISTO_BUCCAL_CUSP], Material.COMPOSITE);

    // 17 (Second Molar)
    // Verify: Palatal Cusps, Full Buccal Surface
    teeth[17].restoration.addFilling([ToothZone.MESIO_PALATAL_CUSP], Material.GOLD);
    teeth[17].restoration.addFilling([ToothZone.DISTO_PALATAL_CUSP], Material.GOLD);
    teeth[17].restoration.addFilling([ToothZone.BUCCAL], Material.CERAMIC); // Full Surface Highlight

    // 26 (Molar)
    // Verify: Decay Surface (Red) + Cervical
    teeth[26].pathology.addDecay([ToothZone.BUCCAL]); // Should be Red Surface
    teeth[26].restoration.addFilling([ToothZone.CERVICAL_BUCCAL], Material.COMPOSITE);

    // --- PREMOLAR TEST ---
    // 14
    teeth[14].restoration.addFilling([ToothZone.OCCLUSAL], Material.COMPOSITE);

    // --- CONDITION TEST CASES ---

    // 46: Missing Tooth
    teeth[46].isMissing = true;

    // 24: Crown (Natural Base)
    // Verify: Crown Image
    teeth[24].restoration.addCrown(Material.CERAMIC, 'Sufficient', 'Single Crown', 'Natural');

    // 21: Implant
    // Verify: Implant Image
    teeth[21].restoration.addCrown(Material.CERAMIC, 'Sufficient', 'Single Crown', 'Implant');

    teeth[35].isMissing = true;
    teeth[36].restoration.addCrown(Material.CERAMIC, 'Sufficient', 'Single Crown', 'Implant');

    return teeth;
};
