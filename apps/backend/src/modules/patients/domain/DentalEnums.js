/**
 * Dental Enums & Constants
 * CommonJS version for Backend
 */

const Gender = Object.freeze({
    MALE: 'Male',
    FEMALE: 'Female',
    OTHER: 'Other'
});

const ToothZone = Object.freeze({
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
    DISTO_PALATAL_CUSP: 'Disto Palatal Cusp',
    APICAL: 'Apical'
});

const Material = Object.freeze({
    COMPOSITE: 'Composite',
    CERAMIC: 'Ceramic',
    GOLD: 'Gold',
    NON_PRECIOUS: 'Non-Precious'
});

const Quality = Object.freeze({
    SUFFICIENT: 'Sufficient',
    UNCERTAIN: 'Uncertain',
    INSUFFICIENT: 'Insufficient'
});

const CrownType = Object.freeze({
    SINGLE: 'Single',
    ABUTMENT: 'Abutment',
    PONTIC: 'Pontic'
});

const ActionType = Object.freeze({
    MONITOR: 'Monitor',
    TREAT: 'Treat',
    SAVE: 'Save',
    DONE: 'Done'
});

module.exports = {
    Gender,
    ToothZone,
    Material,
    Quality,
    CrownType,
    ActionType
};
