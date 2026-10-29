import { ToothZone } from '../models/Enums';

const getToothIndex = (toothNumber) => parseInt(toothNumber, 10) % 10;

const isMolar = (toothNumber) => getToothIndex(toothNumber) >= 6;
const isPremolar = (toothNumber) => {
    const index = getToothIndex(toothNumber);
    return index === 4 || index === 5;
};

export const getRestorationPresetZones = (restorationType, toothNumber) => {
    if (!restorationType || !toothNumber) {
        return [];
    }

    switch (restorationType) {
        case 'crown':
            if (isMolar(toothNumber)) {
                return [
                    ToothZone.MESIAL,
                    ToothZone.OCCLUSAL,
                    ToothZone.DISTAL,
                    ToothZone.MESIO_BUCCAL_CUSP,
                    ToothZone.DISTO_BUCCAL_CUSP,
                    ToothZone.MESIO_PALATAL_CUSP,
                    ToothZone.DISTO_PALATAL_CUSP,
                ];
            }

            if (isPremolar(toothNumber)) {
                return [
                    ToothZone.BUCCAL,
                    ToothZone.MESIAL,
                    ToothZone.OCCLUSAL,
                    ToothZone.DISTAL,
                    ToothZone.PALATAL,
                    'Buccal Cusp',
                    'Lingual Cusp',
                ];
            }

            return [
                ToothZone.BUCCAL,
                ToothZone.OCCLUSAL,
                ToothZone.PALATAL,
            ];
        case 'inlay':
            return [ToothZone.OCCLUSAL, ToothZone.MESIAL, ToothZone.DISTAL];
        case 'onlay':
            return [ToothZone.MESIAL, ToothZone.DISTAL];
        case 'partial_crown':
            return isMolar(toothNumber)
                ? [ToothZone.BUCCAL, ToothZone.MESIO_BUCCAL_CUSP, ToothZone.DISTO_BUCCAL_CUSP]
                : [ToothZone.BUCCAL, 'Buccal Cusp'];
        default:
            return [];
    }
};
