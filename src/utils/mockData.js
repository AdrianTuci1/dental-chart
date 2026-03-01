import { Gender, ToothZone, Material, Quality, ActionType } from '../models/DentalModels.js';

/**
 * --- HIERARCHICAL MOCK DATA ---
 * Structure: medic > patient > history | treatmentPlan
 * 
 * Note: Following the user's requirement, the "Chart" itself is just a visual projection.
 * The absolute source of truth for any tooth state is either:
 * 1. History (Completed interventions)
 * 2. Treatment Plan (Planned or Monitoring interventions)
 */
export const MOCK_HIERARCHY_DATA = [
    {
        id: 'medic-1',
        name: 'Dr. John Watson',
        specialty: 'General Dentistry',
        patients: [
            {
                id: 'patient-1',
                fullName: 'John Doe',
                dateOfBirth: '1980-05-15',
                gender: Gender.MALE,
                phone: '555-0123',
                email: 'john.doe@example.com',
                medicalIssues: {
                    highBloodPressure: true,
                    asthma: false,
                    allergies: ['Penicillin'],
                    other: ['Anxious about dental procedures']
                },
                lastExamDate: '2024-10-01',
                // PREVIOUSLY PLANNED OR MONITORING
                treatmentPlan: [
                    { id: 'tp1', isoNumber: 11, type: 'decay', zones: [ToothZone.MESIAL, ToothZone.DISTAL], status: 'planned', priority: 'medium', cost: 150 },
                    { id: 'tp-endo-1', isoNumber: 11, type: 'endodontic', cold: 'Positive', percussion: 'Normal', status: 'monitoring' },
                    { id: 'tp-endo-2', isoNumber: 16, type: 'endodontic', palpation: 'Sensitive', heat: 'Positive', status: 'planned', cost: 600 },
                    { id: 'tp-decay-2', isoNumber: 26, type: 'decay', zones: [ToothZone.BUCCAL], status: 'planned' },
                    { id: 'tp-endo-3', isoNumber: 26, type: 'endodontic', electricity: 'Non-responsive', status: 'monitoring' },
                    { id: 'tp-ext-1', isoNumber: 44, type: 'extraction', status: 'planned' },
                    { id: 'tp-ext-2', isoNumber: 27, type: 'extraction', status: 'planned' }
                ],
                // PREVIOUSLY COMPLETED
                history: [
                    { id: 'h-1', isoNumber: 11, type: 'restoration', subtype: 'filling', material: Material.COMPOSITE, zones: [ToothZone.INCISAL, ToothZone.CERVICAL_BUCCAL], status: 'completed', date: '2024-05-10' },
                    { id: 'h-2', isoNumber: 12, type: 'restoration', subtype: 'filling', material: Material.COMPOSITE, zones: ['Class 4 Mesial', 'Class 4 Distal'], status: 'completed', date: '2024-05-10' },
                    { id: 'h-3', isoNumber: 12, type: 'restoration', subtype: 'filling', material: Material.GOLD, zones: [ToothZone.PALATAL], status: 'completed', date: '2023-11-20' },
                    { id: 'h-6', isoNumber: 26, type: 'restoration', subtype: 'filling', material: Material.COMPOSITE, zones: [ToothZone.CERVICAL_BUCCAL], status: 'completed' },
                    { id: 'h-7', isoNumber: 46, type: 'missing', status: 'completed' },
                    { id: 'h-8', isoNumber: 24, type: 'restoration', subtype: 'crown', material: Material.CERAMIC, base: 'Natural', quality: 'Sufficient', status: 'completed' },
                    { id: 'h-9', isoNumber: 21, type: 'restoration', subtype: 'crown', material: Material.CERAMIC, base: 'Implant', quality: 'Sufficient', status: 'completed' },
                    // Implants of different materials
                    { id: 'h-imp-1', isoNumber: 35, type: 'restoration', subtype: 'crown', material: Material.GOLD, base: 'Implant', status: 'completed' },
                    { id: 'h-imp-2', isoNumber: 36, type: 'restoration', subtype: 'crown', material: Material.NON_PRECIOUS, base: 'Implant', status: 'completed' },
                    { id: 'h-imp-3', isoNumber: 16, type: 'restoration', subtype: 'crown', material: Material.CERAMIC, base: 'Implant', status: 'completed' },
                    // Implants with fillings to reflect restoration on surface
                    { id: 'h-imp-fill-1', isoNumber: 35, type: 'restoration', subtype: 'filling', material: Material.CERAMIC, zones: [ToothZone.MESIAL, ToothZone.OCCLUSAL, ToothZone.DISTAL, 'Buccal Cusp', 'Lingual Cusp', 'Buccal Surf', 'Lingual Surf', ToothZone.BUCCAL, ToothZone.LINGUAL], status: 'completed' },
                    { id: 'h-imp-fill-2', isoNumber: 36, type: 'restoration', subtype: 'filling', material: Material.CERAMIC, zones: [ToothZone.MESIAL, ToothZone.OCCLUSAL, ToothZone.DISTAL, 'Buccal Cusp', 'Lingual Cusp', 'Buccal Surf', 'Lingual Surf', ToothZone.BUCCAL, ToothZone.LINGUAL], status: 'completed' },
                    { id: 'h-imp-fill-3', isoNumber: 16, type: 'restoration', subtype: 'filling', material: Material.CERAMIC, zones: [ToothZone.MESIAL, ToothZone.DISTAL, ToothZone.MESIO_BUCCAL_CUSP, ToothZone.DISTO_BUCCAL_CUSP, ToothZone.MESIO_PALATAL_CUSP, ToothZone.DISTO_PALATAL_CUSP], status: 'completed' },
                    // Missing tooth explicitly added
                    { id: 'h-miss-1', isoNumber: 38, type: 'missing', status: 'completed' },
                    // Pontics
                    { id: 'h-pon-1', isoNumber: 46, type: 'restoration', subtype: 'crown', crownType: 'Pontic', material: Material.CERAMIC, status: 'completed' },
                    { id: 'h-pon-2', isoNumber: 45, type: 'restoration', subtype: 'crown', crownType: 'Pontic', material: Material.COMPOSITE, status: 'completed' },
                    // Pontics with surface restorations (fillings on pontics)
                    { id: 'h-pon-fill-2', isoNumber: 45, type: 'restoration', subtype: 'filling', material: Material.COMPOSITE, zones: [ToothZone.DISTAL, ToothZone.MESIAL], status: 'completed' },
                    // Regular filling on 47
                    { id: 'h-fill-47', isoNumber: 47, type: 'restoration', subtype: 'filling', material: Material.GOLD, zones: [ToothZone.OCCLUSAL, ToothZone.LINGUAL], status: 'completed' }
                ],
                chart: { id: 'chart-1', lastUpdated: '2024-10-01', teeth: [] }
            },
            {
                id: 'patient-2',
                fullName: 'Jane Smith',
                dateOfBirth: '1992-08-22',
                gender: Gender.FEMALE,
                phone: '555-0456',
                email: 'jane.smith@example.com',
                medicalIssues: { highBloodPressure: false, asthma: true },
                lastExamDate: '2024-11-15',
                treatmentPlan: [
                    { id: 'tp-path-1', isoNumber: 26, type: 'pathology', subtype: 'fracture', crown: 'Vertical', status: 'planned' },
                    { id: 'tp-path-2', isoNumber: 48, type: 'pathology', subtype: 'fracture', crown: 'Horizontal', root: 'Vertical', status: 'planned' },
                    { id: 'tp-ext-2', isoNumber: 48, type: 'extraction', status: 'planned' }
                ],
                history: [
                    { id: 'h-miss-1', isoNumber: 35, type: 'missing', status: 'completed' },
                    { id: 'h-crown-1', isoNumber: 36, type: 'restoration', subtype: 'crown', material: Material.CERAMIC, base: 'Implant', quality: 'Sufficient', status: 'completed' }
                ],
                chart: { id: 'chart-2', lastUpdated: '2024-11-15', teeth: [] }
            },
            {
                id: 'patient-3',
                fullName: 'Michael Johnson',
                dateOfBirth: '1975-03-10',
                gender: Gender.MALE,
                phone: '555-0789',
                email: 'michael.j@example.com',
                medicalIssues: { highBloodPressure: true, tobaccoUse: true },
                lastExamDate: '2024-12-05',
                treatmentPlan: [
                    { id: 'tp-path-3', isoNumber: 27, type: 'pathology', subtype: 'fracture', crown: 'Horizontal', status: 'planned' }
                ],
                history: [
                    { id: 'h-fill-1', isoNumber: 17, type: 'restoration', subtype: 'filling', zones: [ToothZone.PALATAL_CUSP], material: Material.GOLD, status: 'completed' },
                    { id: 'h-fill-2', isoNumber: 17, type: 'restoration', subtype: 'filling', zones: [ToothZone.BUCCAL, ToothZone.MESIAL, ToothZone.DISTAL], material: Material.COMPOSITE, status: 'completed' },
                    { id: 'h-fill-3', isoNumber: 13, type: 'restoration', subtype: 'filling', zones: [ToothZone.CERVICAL_PALATAL], material: Material.COMPOSITE, status: 'completed' },
                    { id: 'h-fill-4', isoNumber: 27, type: 'restoration', subtype: 'filling', zones: [ToothZone.PALATAL], material: Material.AMALGAM, status: 'completed' },
                    { id: 'h-fill-5', isoNumber: 27, type: 'restoration', subtype: 'filling', zones: [ToothZone.BUCCAL_CUSP], material: Material.COMPOSITE, status: 'completed' }
                ],
                // Add Periodontal as a specific condition type (can be huge)
                chart: { id: 'chart-3', lastUpdated: '2024-12-05', teeth: [] }
            }
        ]
    }
];
