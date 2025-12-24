/**
 * Dental Enums & Constants
 * Extracted from DentalModels.js
 */

export const Gender = Object.freeze({
    MALE: 'Male',
    FEMALE: 'Female',
    OTHER: 'Other'
});

export const ToothZone = Object.freeze({
    CERVICAL_BUCCAL: 'Cervical Buccal',
    BUCCAL: 'Buccal',
    OCCLUSAL: 'Occlusal',
    DISTAL: 'Distal',
    MESIAL: 'Mesial',
    PALATAL: 'Palatal',
    CERVICAL_PALATAL: 'Cervical Palatal',
    MESIO_BUCCAL_CUSP: 'Mesio Buccal Cusp',
    DISTO_BUCCAL_CUSP: 'Disto Buccal Cusp',
    MESIO_PALATAL_CUSP: 'Mesio Palatal Cusp',
    DISTO_PALATAL_CUSP: 'Disto Palatal Cusp'
});

export const Material = Object.freeze({
    COMPOSITE: 'Composite',
    CERAMIC: 'Ceramic',
    GOLD: 'Gold',
    NON_PRECIOUS: 'Non-Precious'
});

export const Quality = Object.freeze({
    SUFFICIENT: 'Sufficient',
    UNCERTAIN: 'Uncertain',
    INSUFFICIENT: 'Insufficient'
});

export const CrownType = Object.freeze({
    SINGLE: 'Single',
    ABUTMENT: 'Abutment',
    PONTIC: 'Pontic'
});

export const CrownBase = Object.freeze({
    NATURAL: 'Natural',
    IMPLANT: 'Implant'
});

export const Mobility = Object.freeze({
    CLASS_1: 'Class 1',
    CLASS_2: 'Class 2',
    CLASS_3: 'Class 3'
});

export const Furcation = Object.freeze({
    STAGE_1: 'Stage 1',
    STAGE_2: 'Stage 2',
    STAGE_3: 'Stage 3'
});

export const ActionType = Object.freeze({
    MONITOR: 'Monitor',
    TREAT: 'Treat',
    SAVE: 'Save',
    DONE: 'Done'
});

// Pathology Options Configuration
export const PathologyOptions = Object.freeze({
    DECAY: {
        id: 'decay',
        label: 'Decay',
        steps: [
            {
                id: 'material',
                label: 'Material',
                options: [
                    { id: 'dentin', label: 'Dentin', value: 'dentin' },
                    { id: 'enamel', label: 'Enamel', value: 'enamel' }
                ]
            },
            {
                id: 'cavitation',
                label: 'Cavitation',
                options: [
                    { id: 'cavitation', label: 'Cavitation', value: 'cavitation' },
                    { id: 'no-cavitation', label: 'No Cavitation', value: 'no-cavitation' }
                ]
            },
            {
                id: 'level',
                label: 'Level',
                options: [
                    { id: 'c1', label: 'C1', value: 'C1' },
                    { id: 'c2', label: 'C2', value: 'C2' },
                    { id: 'c3', label: 'C3', value: 'C3' },
                    { id: 'c4', label: 'C4', value: 'C4' }
                ]
            }
        ]
    },
    FRACTURE: {
        id: 'fracture',
        label: 'Fracture',
        steps: [
            {
                id: 'location',
                label: 'Location',
                options: [
                    { id: 'crown', label: 'Crown', value: 'crown' },
                    { id: 'root', label: 'Root', value: 'root' }
                ]
            },
            {
                id: 'direction',
                label: 'Direction',
                dependsOn: 'root', // Only show if 'root' is selected in previous step
                options: [
                    { id: 'vertical', label: 'Vertical', value: 'vertical' },
                    { id: 'horizontal', label: 'Horizontal', value: 'horizontal' }
                ]
            }
        ]
    },
    TOOTH_WEAR: {
        id: 'tooth-wear',
        label: 'Tooth Wear',
        steps: [
            {
                id: 'type',
                label: 'Type',
                options: [
                    { id: 'abrasion', label: 'Abrasion', value: 'abrasion' },
                    { id: 'erosion', label: 'Erosion', value: 'erosion' }
                ]
            },
            {
                id: 'surface',
                label: 'Surface',
                options: [
                    { id: 'buccal', label: 'Buccal', value: 'buccal' },
                    { id: 'lingual', label: 'Lingual', value: 'lingual' }
                ]
            }
        ]
    },
    DISCOLORATION: {
        id: 'discoloration',
        label: 'Discoloration',
        steps: [
            {
                id: 'color',
                label: 'Color',
                options: [
                    { id: 'gray', label: 'Gray', value: 'gray' },
                    { id: 'red', label: 'Red', value: 'red' },
                    { id: 'yellow', label: 'Yellow', value: 'yellow' }
                ]
            }
        ]
    },
    APICAL: {
        id: 'apical',
        label: 'Apical',
        steps: [
            {
                id: 'present',
                label: 'Apical Pathology',
                options: [
                    { id: 'yes', label: 'Yes', value: true },
                    { id: 'no', label: 'No', value: false }
                ]
            }
        ]
    },
    DEVELOPMENT_DISORDER: {
        id: 'development-disorder',
        label: 'Development Disorder',
        steps: [
            {
                id: 'present',
                label: 'Development Disorder',
                options: [
                    { id: 'yes', label: 'Yes', value: true },
                    { id: 'no', label: 'No', value: false }
                ]
            }
        ]
    }
});

// Restoration Options Configuration
export const RestorationOptions = Object.freeze({
    FILLING: {
        id: 'filling',
        label: 'Filling',
        steps: [
            {
                id: 'material',
                label: 'Material',
                options: [
                    { id: 'composite', label: 'Composite', value: 'Composite' },
                    { id: 'ceramic', label: 'Ceramic', value: 'Ceramic' },
                    { id: 'gold', label: 'Gold', value: 'Gold' },
                    { id: 'non-precious', label: 'Non-Precious Metal', value: 'Non-Precious' }
                ]
            },
            {
                id: 'quality',
                label: 'Quality',
                options: [
                    { id: 'sufficient', label: 'Sufficient', value: 'Sufficient' },
                    { id: 'uncertain', label: 'Uncertain', value: 'Uncertain' },
                    { id: 'insufficient', label: 'Insufficient', value: 'Insufficient' }
                ]
            }
        ]
    },
    VENEER: {
        id: 'veneer',
        label: 'Veneer',
        steps: [
            {
                id: 'material',
                label: 'Material',
                options: [
                    { id: 'composite', label: 'Composite', value: 'Composite' },
                    { id: 'ceramic', label: 'Ceramic', value: 'Ceramic' },
                    { id: 'gold', label: 'Gold', value: 'Gold' },
                    { id: 'non-precious', label: 'Non-Precious Metal', value: 'Non-Precious' }
                ]
            },
            {
                id: 'quality',
                label: 'Quality',
                options: [
                    { id: 'sufficient', label: 'Sufficient', value: 'Sufficient' },
                    { id: 'uncertain', label: 'Uncertain', value: 'Uncertain' },
                    { id: 'insufficient', label: 'Insufficient', value: 'Insufficient' }
                ]
            },
            {
                id: 'detail',
                label: 'Detail',
                options: [
                    { id: 'overhang', label: 'Overhang', value: 'Overhang' },
                    { id: 'flush', label: 'Flush', value: 'Flush' },
                    { id: 'shortfall', label: 'Shortfall', value: 'Shortfall' }
                ]
            }
        ]
    },
    CROWN: {
        id: 'crown',
        label: 'Crown',
        steps: [
            {
                id: 'material',
                label: 'Material',
                options: [
                    { id: 'composite', label: 'Composite', value: 'Composite' },
                    { id: 'ceramic', label: 'Ceramic', value: 'Ceramic' },
                    { id: 'gold', label: 'Gold', value: 'Gold' },
                    { id: 'non-precious', label: 'Non-Precious Metal', value: 'Non-Precious' }
                ]
            },
            {
                id: 'crownType',
                label: 'Crown Type',
                options: [
                    { id: 'single', label: 'Single Crown', value: 'Single' },
                    { id: 'abutment', label: 'Abutment', value: 'Abutment' },
                    { id: 'pontic', label: 'Pontic', value: 'Pontic' }
                ]
            },
            {
                id: 'crownBase',
                label: 'Crown Base',
                options: [
                    { id: 'natural', label: 'Natural', value: 'Natural' },
                    { id: 'implant', label: 'Implant', value: 'Implant' }
                ]
            },
            {
                id: 'implantType',
                label: 'Implant Type',
                dependsOn: 'implant', // Only show if 'implant' is selected in previous step
                options: [
                    { id: 'bone-level', label: 'Bone Level', value: 'Bone Level' },
                    { id: 'tissue-level', label: 'Tissue Level', value: 'Tissue Level' }
                ]
            }
        ]
    }
});
