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
                oralHealth: {
                    plaqueIndex: 15,
                    bleedingIndex: 8,
                    halitosis: false
                },
                bpe: {
                    upperRight: 1,
                    upperAnterior: 0,
                    upperLeft: 2,
                    lowerRight: 1,
                    lowerAnterior: 0,
                    lowerLeft: 1
                },
                lastExamDate: '2024-10-01',
                treatmentPlan: {
                    items: [
                        { id: 'tp1', tooth: 11, type: 'decay', procedure: 'Decay Treatment', zones: [ToothZone.MESIAL, ToothZone.DISTAL], status: 'planned', priority: 'medium', cost: 150 },
                        { id: 'tp-endo-1', tooth: 11, type: 'endodontic', procedure: 'Cold: Positive, Percussion: Normal', status: 'monitoring' },
                        { id: 'tp-endo-2', tooth: 16, type: 'endodontic', procedure: 'Palpation: Sensitive, Heat: Positive', status: 'planned', cost: 600 },
                        { id: 'tp-decay-2', tooth: 26, type: 'decay', procedure: 'Decay Treatment', zones: [ToothZone.BUCCAL], status: 'planned' },
                        { id: 'tp-endo-3', tooth: 26, type: 'endodontic', procedure: 'Electricity: Non-responsive', status: 'monitoring' },
                        { id: 'tp-ext-1', tooth: 44, type: 'extraction', procedure: 'Extraction', status: 'planned' },
                        { id: 'tp-ext-2', tooth: 27, type: 'extraction', procedure: 'Extraction', status: 'planned' }
                    ]
                },
                history: {
                    completedItems: [
                        { id: 'h-1', tooth: 11, type: 'restoration', subtype: 'filling', material: Material.COMPOSITE, zones: [ToothZone.INCISAL, ToothZone.CERVICAL_BUCCAL], status: 'completed', date: '2024-05-10', procedure: 'Composite Filling' },
                        { id: 'h-2', tooth: 12, type: 'restoration', subtype: 'filling', material: Material.COMPOSITE, zones: ['Class 4 Mesial', 'Class 4 Distal'], status: 'completed', date: '2024-05-10', procedure: 'Composite Filling' },
                        { id: 'h-3', tooth: 12, type: 'restoration', subtype: 'filling', material: Material.GOLD, zones: [ToothZone.PALATAL], status: 'completed', date: '2023-11-20', procedure: 'Gold Filling' },
                        { id: 'h-6', tooth: 26, type: 'restoration', subtype: 'filling', material: Material.COMPOSITE, zones: [ToothZone.CERVICAL_BUCCAL], status: 'completed', procedure: 'Composite Filling' },
                        { id: 'h-7', tooth: 46, type: 'missing', status: 'completed', procedure: 'Missing Tooth' },
                        { id: 'h-8', tooth: 24, type: 'restoration', subtype: 'crown', material: Material.CERAMIC, base: 'Natural', quality: 'Sufficient', status: 'completed', procedure: 'Ceramic Crown' },
                        { id: 'h-9', tooth: 21, type: 'restoration', subtype: 'crown', material: Material.CERAMIC, base: 'Implant', quality: 'Sufficient', status: 'completed', procedure: 'Implant Supported Crown' },
                        { id: 'h-imp-1', tooth: 35, type: 'restoration', subtype: 'crown', material: Material.GOLD, base: 'Implant', status: 'completed', procedure: 'Gold Implant Crown' },
                        { id: 'h-imp-2', tooth: 36, type: 'restoration', subtype: 'crown', material: Material.NON_PRECIOUS, base: 'Implant', status: 'completed', procedure: 'Non-Precious Implant Crown' },
                        { id: 'h-imp-3', tooth: 16, type: 'restoration', subtype: 'crown', material: Material.CERAMIC, base: 'Implant', status: 'completed', procedure: 'Ceramic Implant Crown' },
                        { id: 'h-imp-fill-1', tooth: 35, type: 'restoration', subtype: 'filling', material: Material.CERAMIC, zones: [ToothZone.MESIAL, ToothZone.OCCLUSAL, ToothZone.DISTAL, 'Buccal Cusp', 'Lingual Cusp', 'Buccal Surf', 'Lingual Surf', ToothZone.BUCCAL, ToothZone.LINGUAL], status: 'completed', procedure: 'Surface Restoration' },
                        { id: 'h-imp-fill-2', tooth: 36, type: 'restoration', subtype: 'filling', material: Material.CERAMIC, zones: [ToothZone.MESIAL, ToothZone.OCCLUSAL, ToothZone.DISTAL, 'Buccal Cusp', 'Lingual Cusp', 'Buccal Surf', 'Lingual Surf', ToothZone.BUCCAL, ToothZone.LINGUAL], status: 'completed', procedure: 'Surface Restoration' },
                        { id: 'h-imp-fill-3', tooth: 16, type: 'restoration', subtype: 'filling', material: Material.CERAMIC, zones: [ToothZone.MESIAL, ToothZone.DISTAL, ToothZone.MESIO_BUCCAL_CUSP, ToothZone.DISTO_BUCCAL_CUSP, ToothZone.MESIO_PALATAL_CUSP, ToothZone.DISTO_PALATAL_CUSP], status: 'completed', procedure: 'Surface Restoration' },
                        { id: 'h-miss-1', tooth: 38, type: 'missing', status: 'completed', procedure: 'Missing Tooth' },
                        { id: 'h-pon-1', tooth: 46, type: 'restoration', subtype: 'crown', crownType: 'Pontic', material: Material.CERAMIC, status: 'completed', procedure: 'Ceramic Pontic' },
                        { id: 'h-pon-2', tooth: 45, type: 'restoration', subtype: 'crown', crownType: 'Pontic', material: Material.COMPOSITE, status: 'completed', procedure: 'Composite Pontic' },
                        { id: 'h-pon-fill-2', tooth: 45, type: 'restoration', subtype: 'filling', material: Material.COMPOSITE, zones: [ToothZone.DISTAL, ToothZone.MESIAL], status: 'completed', procedure: 'Pontic Filling' },
                        { id: 'h-fill-47', tooth: 47, type: 'restoration', subtype: 'filling', material: Material.GOLD, zones: [ToothZone.OCCLUSAL, ToothZone.LINGUAL], status: 'completed', procedure: 'Gold Filling' }
                    ]
                },
                chart: { id: 'chart-1', lastUpdated: '2024-10-01', teeth: [] }
            }
        ]
    }
];

export const user0profile = {
    name: 'Daniel Smith',
    title: 'Senior Dental Surgeon',
    bio: 'Dedicated to providing high-quality dental care with over 12 years of experience.',
    email: 'daniel.smith@example.com',
    phone: '+40 722 000 000',
    location: 'Bucharest Regional Clinic',
    license: 'DS-99021-XPR',
    specialization: 'Oral Surgery & Implants',
    avatarInfo: {
        initials: 'DS',
        color: '#4f46e5'
    }
};
