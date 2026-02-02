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

        // Add varied mock conditions for demonstration
        const rand = Math.random();

        if (rand > 0.85) {
            // Occlusal filling (topview)
            teeth[num].restoration.addFilling([ToothZone.OCCLUSAL], Material.COMPOSITE, Quality.SUFFICIENT);
        } else if (rand > 0.7) {
            // Buccal filling (frontal view)
            teeth[num].restoration.addFilling([ToothZone.BUCCAL], Material.COMPOSITE, Quality.GOOD);
        } else if (rand > 0.55) {
            // Mesial filling (shows on frontal & topview)
            teeth[num].restoration.addFilling([ToothZone.MESIAL], Material.AMALGAM, Quality.SUFFICIENT);
        } else if (rand > 0.4) {
            // Distal filling (shows on frontal & topview)
            teeth[num].restoration.addFilling([ToothZone.DISTAL], Material.COMPOSITE, Quality.GOOD);
        } else if (rand > 0.3) {
            // Multiple surfaces
            teeth[num].restoration.addFilling([ToothZone.OCCLUSAL, ToothZone.MESIAL], Material.COMPOSITE, Quality.SUFFICIENT);
        }
    });

    return teeth;
};

