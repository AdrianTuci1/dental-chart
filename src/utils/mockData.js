import { Gender, ToothZone, Material, Quality, ActionType } from '../models/DentalModels.js';
import { generateDentitionByAge } from './toothUtils.js';

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
                name: 'John Doe',
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
                        { id: 'tp-endo-2', tooth: 16, type: 'endodontic', procedure: 'RCT (Root Canal Treatment)', status: 'planned', cost: 1200 },
                        { id: 'tp-endo-3', tooth: 14, type: 'endodontic', procedure: 'Endodontic Treatment', status: 'planned', cost: 800 },
                        { id: 'tp-endo-4', tooth: 11, type: 'endodontic', procedure: 'Observe Pulpal State', status: 'monitoring' },
                        { id: 'tp-decay-2', tooth: 26, type: 'decay', procedure: 'Decay Treatment', zones: [ToothZone.BUCCAL], status: 'planned' },
                        { id: 'tp-endo-5', tooth: 26, type: 'endodontic', procedure: 'Electricity: Non-responsive', status: 'monitoring' },
                        { id: 'tp-ext-1', tooth: 44, type: 'extraction', procedure: 'Extraction', status: 'planned' },
                        { id: 'tp-ext-2', tooth: 27, type: 'extraction', procedure: 'Extraction', status: 'planned' },
                        { id: 'tp-endo-lower-1', tooth: 47, type: 'endodontic', procedure: 'RCT (Root Canal)', status: 'planned', cost: 1100 },
                        { id: 'tp-dec-99', tooth: 54, type: 'decay', procedure: 'Primary Decay Treatment', zones: [ToothZone.OCCLUSAL], status: 'planned' },
                        { id: 'tp-endo-lower-2', tooth: 34, type: 'endodontic', procedure: 'Tratament endodontic', status: 'planned' }
                    ]
                },
                history: {
                    completedItems: [
                        { id: 'h-1', tooth: 11, type: 'restoration', subtype: 'filling', material: Material.COMPOSITE, zones: [ToothZone.INCISAL, ToothZone.CERVICAL_BUCCAL], status: 'completed', date: '2024-05-10', procedure: 'Composite Filling' },
                        { id: 'h-2', tooth: 12, type: 'restoration', subtype: 'filling', material: Material.COMPOSITE, zones: ['Class 4 Mesial', 'Class 4 Distal'], status: 'completed', date: '2024-05-10', procedure: 'Composite Filling' },
                        { id: 'h-3', tooth: 12, type: 'restoration', subtype: 'filling', material: Material.GOLD, zones: [ToothZone.PALATAL], status: 'completed', date: '2023-11-20', procedure: 'Gold Filling' },
                        { id: 'h-6', tooth: 26, type: 'restoration', subtype: 'filling', material: Material.COMPOSITE, zones: [ToothZone.CERVICAL_BUCCAL], status: 'completed', date: '2022-04-12', procedure: 'Composite Filling' },
                        { id: 'h-7', tooth: 46, type: 'missing', status: 'completed', date: '2020-08-15', procedure: 'Missing Tooth' },
                        { id: 'h-8', tooth: 24, type: 'restoration', subtype: 'crown', material: Material.CERAMIC, base: 'Natural', quality: 'Sufficient', status: 'completed', date: '2023-01-22', procedure: 'Ceramic Crown' },
                        { id: 'h-9', tooth: 21, type: 'restoration', subtype: 'crown', material: Material.CERAMIC, base: 'Implant', quality: 'Sufficient', status: 'completed', date: '2024-02-15', procedure: 'Implant Supported Crown' },
                        { id: 'h-imp-1', tooth: 35, type: 'restoration', subtype: 'crown', material: Material.GOLD, base: 'Implant', status: 'completed', date: '2021-06-10', procedure: 'Gold Implant Crown' },
                        { id: 'h-imp-2', tooth: 36, type: 'restoration', subtype: 'crown', material: Material.NON_PRECIOUS, base: 'Implant', status: 'completed', date: '2021-06-10', procedure: 'Non-Precious Implant Crown' },
                        { id: 'h-imp-3', tooth: 16, type: 'restoration', subtype: 'crown', material: Material.CERAMIC, base: 'Implant', status: 'completed', date: '2022-09-05', procedure: 'Ceramic Implant Crown' },
                        { id: 'h-miss-1', tooth: 38, type: 'missing', status: 'completed', date: '2019-11-20', procedure: 'Missing Tooth' },
                        { id: 'h-pon-1', tooth: 46, type: 'restoration', subtype: 'crown', crownType: 'Pontic', material: Material.CERAMIC, status: 'completed', date: '2024-01-15', procedure: 'Ceramic Pontic' },
                        { id: 'h-pon-2', tooth: 45, type: 'restoration', subtype: 'crown', crownType: 'Pontic', material: Material.COMPOSITE, status: 'completed', date: '2024-01-15', procedure: 'Composite Pontic' },
                        {
                            id: 'perio-17', tooth: 17, type: 'periodontal', status: 'completed', date: '2024-10-01',
                            probingDepth: { distoLingual: 4, lingual: 3, mesioLingual: 4, distoBuccal: 3, buccal: 2, mesioBuccal: 3 },
                            gingivalMargin: { distoLingual: -1, lingual: 0, mesioLingual: -1, distoBuccal: 0, buccal: 0, mesioBuccal: 0 },
                            bleedingSites: ['distoLingual', 'mesioLingual'],
                            plaqueSites: ['distoLingual', 'lingual', 'mesioLingual'],
                            furcation: 1
                        },
                        {
                            id: 'perio-16', tooth: 16, type: 'periodontal', status: 'completed', date: '2024-10-01',
                            probingDepth: { distoLingual: 5, lingual: 4, mesioLingual: 4, distoBuccal: 3, buccal: 2, mesioBuccal: 3 },
                            gingivalMargin: { distoLingual: -2, lingual: -1, mesioLingual: -2, distoBuccal: -1, buccal: 0, mesioBuccal: -1 },
                            bleedingSites: ['distoLingual', 'lingual', 'mesioLingual'],
                            plaqueSites: ['distoLingual', 'mesioLingual', 'mesioBuccal'],
                            furcation: 2,
                            mobility: 1
                        },
                        {
                            id: 'perio-11', tooth: 11, type: 'periodontal', status: 'completed', date: '2024-10-01',
                            probingDepth: { distoLingual: 3, lingual: 2, mesioLingual: 3, distoBuccal: 2, buccal: 1, mesioBuccal: 2 },
                            gingivalMargin: { distoLingual: -1, lingual: 0, mesioLingual: -1, distoBuccal: 0, buccal: 0, mesioBuccal: -1 },
                            bleedingSites: ['distoLingual', 'mesioLingual']
                        },
                        {
                            id: 'perio-21', tooth: 21, type: 'periodontal', status: 'completed', date: '2024-10-01',
                            probingDepth: { distoLingual: 2, lingual: 2, mesioLingual: 2, distoBuccal: 2, buccal: 1, mesioBuccal: 2 },
                            gingivalMargin: { distoLingual: 0, lingual: 0, mesioLingual: 0, distoBuccal: 0, buccal: 0, mesioBuccal: 0 },
                            bleedingSites: []
                        },
                        {
                            id: 'perio-26', tooth: 26, type: 'periodontal', status: 'completed', date: '2024-10-01',
                            probingDepth: { distoLingual: 4, lingual: 3, mesioLingual: 5, distoBuccal: 3, buccal: 2, mesioBuccal: 4 },
                            gingivalMargin: { distoLingual: -1, lingual: -1, mesioLingual: -2, distoBuccal: 0, buccal: 0, mesioBuccal: -1 },
                            bleedingSites: ['mesioLingual', 'mesioBuccal'],
                            plaqueSites: ['distoLingual', 'mesioLingual']
                        },
                        {
                            id: 'perio-36', tooth: 36, type: 'periodontal', status: 'completed', date: '2024-10-01',
                            probingDepth: { distoLingual: 3, lingual: 2, mesioLingual: 3, distoBuccal: 2, buccal: 2, mesioBuccal: 2 },
                            gingivalMargin: { distoLingual: -1, lingual: 0, mesioLingual: -1, distoBuccal: 0, buccal: 0, mesioBuccal: 0 },
                            bleedingSites: ['distoLingual']
                        },
                        {
                            id: 'perio-31', tooth: 31, type: 'periodontal', status: 'completed', date: '2024-10-01',
                            probingDepth: { distoLingual: 2, lingual: 2, mesioLingual: 2, distoBuccal: 2, buccal: 3, mesioBuccal: 2 },
                            gingivalMargin: { distoLingual: 0, lingual: 0, mesioLingual: 0, distoBuccal: -1, buccal: -2, mesioBuccal: -1 },
                            bleedingSites: ['buccal'],
                            plaqueSites: ['lingual', 'buccal'],
                            tartarSites: ['lingual']
                        },
                        {
                            id: 'perio-41', tooth: 41, type: 'periodontal', status: 'completed', date: '2024-10-01',
                            probingDepth: { distoLingual: 2, lingual: 2, mesioLingual: 2, distoBuccal: 2, buccal: 2, mesioBuccal: 2 },
                            gingivalMargin: { distoLingual: 0, lingual: 0, mesioLingual: 0, distoBuccal: 0, buccal: -1, mesioBuccal: 0 },
                            bleedingSites: [],
                            plaqueSites: ['lingual']
                        },
                        {
                            id: 'perio-47', tooth: 47, type: 'periodontal', status: 'completed', date: '2024-10-01',
                            probingDepth: { distoLingual: 6, lingual: 5, mesioLingual: 5, distoBuccal: 4, buccal: 3, mesioBuccal: 4 },
                            gingivalMargin: { distoLingual: -3, lingual: -2, mesioLingual: -2, distoBuccal: -1, buccal: -1, mesioBuccal: -2 },
                            bleedingSites: ['distoLingual', 'lingual', 'mesioLingual', 'distoBuccal'],
                            plaqueSites: ['distoLingual', 'lingual', 'distoBuccal', 'mesioBuccal'],
                            mobility: 2,
                            furcation: 1
                        }
                    ]
                },
                chart: { id: 'chart-1', lastUpdated: '2024-10-01', teeth: {} }
            },
            {
                id: 'patient-2',
                name: 'Timmy Doe',
                dateOfBirth: '2018-05-10', // ~8 years old
                gender: Gender.MALE,
                phone: '555-0124',
                email: 'parent.doe@example.com',
                medicalIssues: {
                    highBloodPressure: false,
                    asthma: true,
                    allergies: [],
                    other: []
                },
                oralHealth: {
                    plaqueIndex: 20,
                    bleedingIndex: 5,
                    halitosis: false
                },
                bpe: {
                    upperRight: 0,
                    upperAnterior: 0,
                    upperLeft: 0,
                    lowerRight: 0,
                    lowerAnterior: 0,
                    lowerLeft: 0
                },
                lastExamDate: '2024-10-20',
                treatmentPlan: {
                    items: [
                        { id: 'tp-pedo-1', tooth: 54, type: 'decay', procedure: 'Caries Treatment', zones: [ToothZone.OCCLUSAL], status: 'planned' }
                    ]
                },
                history: {
                    completedItems: []
                },
                // The generateDentitionByAge function will automatically mark 53, 54, 55 (and equivalents) as baby teeth
                chart: { id: 'chart-2', lastUpdated: '2024-10-20', teeth: generateDentitionByAge('2018-05-10') }
            }
        ]
    }
];

export const user0profile = {
    id: 'medic-1',
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

export const MOCK_DETECTIONS = [
    { id: 'det-1', tooth: 17, type: 'Filling', category: 'restoration', color: 'blue', status: 'detected' },
    { id: 'det-2', tooth: 16, type: 'Filling', category: 'restoration', color: 'blue', status: 'detected' },
    { id: 'det-3', tooth: 15, type: 'Root-canal filling | Crown', category: 'restoration', color: 'dark-blue', status: 'detected' },
    { id: 'det-4', tooth: 14, type: 'Filling', category: 'restoration', color: 'blue', status: 'detected' },
    { id: 'det-5', tooth: 13, type: 'Filling', category: 'restoration', color: 'blue', status: 'detected' },
    { id: 'det-6', tooth: 12, type: 'Crown', category: 'restoration', color: 'dark-blue', status: 'detected' },
    { id: 'det-7', tooth: 11, type: 'Root-canal filling | Crown', category: 'restoration', color: 'dark-blue', status: 'detected' },
    { id: 'det-8', tooth: 21, type: "Periapical radiolucency\nCrown", category: 'pathology', color: 'orange', status: 'detected' },
    { id: 'det-9', tooth: 22, type: "Periapical radiolucency\nRoot-canal filling | Crown", category: 'pathology', color: 'orange', status: 'detected' },
];
