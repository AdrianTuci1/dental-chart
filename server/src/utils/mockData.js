const { Gender, ToothZone, Material, Quality, ActionType } = require('../models/Enums');

/**
 * --- MOCK PATIENT TEMPLATES ---
 * Array of patient objects with their history and treatment plans.
 * Used for seeding new medics with clinical data for demo purposes.
 */
const MOCK_PATIENTS_TEMPLATES = [
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
                { id: 'tp-endo-2', tooth: 16, type: 'endodontic', procedure: 'RCT (Root Canal Treatment)', status: 'planned', cost: 1200 },
                { id: 'tp-endo-3', tooth: 14, type: 'endodontic', procedure: 'Endodontic Treatment', status: 'planned', cost: 800 },
                { id: 'tp-endo-4', tooth: 11, type: 'endodontic', procedure: 'Observe Pulpal State', status: 'monitoring' },
                { id: 'tp-decay-2', tooth: 26, type: 'decay', procedure: 'Decay Treatment', zones: [ToothZone.BUCCAL], status: 'planned' },
                { id: 'tp-endo-5', tooth: 26, type: 'endodontic', procedure: 'Electricity: Non-responsive', status: 'monitoring' },
                { id: 'tp-ext-1', tooth: 44, type: 'extraction', procedure: 'Extraction', status: 'planned' },
                { id: 'tp-ext-2', tooth: 27, type: 'extraction', procedure: 'Extraction', status: 'planned' },
                { id: 'tp-endo-lower-1', tooth: 47, type: 'endodontic', procedure: 'RCT (Root Canal)', status: 'planned', cost: 1100 },
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
                { id: 'h-imp-fill-1', tooth: 35, type: 'restoration', subtype: 'filling', material: Material.CERAMIC, zones: [ToothZone.MESIAL, ToothZone.OCCLUSAL, ToothZone.DISTAL, 'Buccal Cusp', 'Lingual Cusp', 'Buccal Surf', 'Lingual Surf', ToothZone.BUCCAL, ToothZone.LINGUAL], status: 'completed', date: '2021-06-10', procedure: 'Surface Restoration' },
                { id: 'h-imp-fill-2', tooth: 36, type: 'restoration', subtype: 'filling', material: Material.CERAMIC, zones: [ToothZone.MESIAL, ToothZone.OCCLUSAL, ToothZone.DISTAL, 'Buccal Cusp', 'Lingual Cusp', 'Buccal Surf', 'Lingual Surf', ToothZone.BUCCAL, ToothZone.LINGUAL], status: 'completed', date: '2021-06-10', procedure: 'Surface Restoration' },
                { id: 'h-imp-fill-3', tooth: 16, type: 'restoration', subtype: 'filling', material: Material.CERAMIC, zones: [ToothZone.MESIAL, ToothZone.DISTAL, ToothZone.MESIO_BUCCAL_CUSP, ToothZone.DISTO_BUCCAL_CUSP, ToothZone.MESIO_PALATAL_CUSP, ToothZone.DISTO_PALATAL_CUSP], status: 'completed', date: '2022-09-05', procedure: 'Surface Restoration' },
                { id: 'h-miss-1', tooth: 38, type: 'missing', status: 'completed', date: '2019-11-20', procedure: 'Missing Tooth' },
                { id: 'h-pon-1', tooth: 46, type: 'restoration', subtype: 'crown', crownType: 'Pontic', material: Material.CERAMIC, status: 'completed', date: '2024-01-15', procedure: 'Ceramic Pontic' },
                { id: 'h-pon-2', tooth: 45, type: 'restoration', subtype: 'crown', crownType: 'Pontic', material: Material.COMPOSITE, status: 'completed', date: '2024-01-15', procedure: 'Composite Pontic' },
                { id: 'h-pon-fill-2', tooth: 45, type: 'restoration', subtype: 'filling', material: Material.COMPOSITE, zones: [ToothZone.DISTAL, ToothZone.MESIAL], status: 'completed', date: '2024-01-15', procedure: 'Pontic Filling' },
                { id: 'h-fill-47', tooth: 47, type: 'restoration', subtype: 'filling', material: Material.GOLD, zones: [ToothZone.OCCLUSAL, ToothZone.LINGUAL], status: 'completed', date: '2023-03-30', procedure: 'Gold Filling' }
            ]
        }
    }
];

module.exports = {
    MOCK_PATIENTS_TEMPLATES
};
