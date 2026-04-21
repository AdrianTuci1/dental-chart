import { describe, expect, it } from 'vitest';
import { ToothZone } from '../../models/Enums';
import { getRestorationPresetZones } from '../restorationZonePresets';
import { getToothCondition, mapToothDataToConditions } from '../toothUtils';

describe('tooth visual rules', () => {
    it('returns a placeholder condition for not-yet-developed teeth', () => {
        expect(getToothCondition({ developmentState: 'not yet developed', isMissing: false })).toBe('notYetDeveloped');
    });

    it('maps development missing states to the missing condition', () => {
        expect(getToothCondition({ developmentState: 'adult tooth missing', isMissing: false })).toBe('missing');
        expect(getToothCondition({ developmentState: 'baby tooth missing', isMissing: false })).toBe('missing');
    });

    it('auto-selects posterior crown coverage zones for molars', () => {
        expect(getRestorationPresetZones('crown', 16)).toEqual([
            ToothZone.MESIAL,
            ToothZone.OCCLUSAL,
            ToothZone.DISTAL,
            ToothZone.MESIO_BUCCAL_CUSP,
            ToothZone.DISTO_BUCCAL_CUSP,
            ToothZone.MESIO_PALATAL_CUSP,
            ToothZone.DISTO_PALATAL_CUSP,
        ]);
    });

    it('auto-selects full premolar crown coverage zones', () => {
        expect(getRestorationPresetZones('crown', 14)).toEqual([
            ToothZone.BUCCAL,
            ToothZone.MESIAL,
            ToothZone.OCCLUSAL,
            ToothZone.DISTAL,
            ToothZone.PALATAL,
            'Buccal Cusp',
            'Lingual Cusp',
        ]);
    });

    it('renders crown masks from preset zones using the material color', () => {
        const conditions = mapToothDataToConditions({
            toothNumber: 16,
            restoration: {
                crowns: [{
                    material: 'Ceramic',
                    zones: getRestorationPresetZones('crown', 16),
                    status: 'completed',
                }],
            },
        });

        expect(conditions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ zone: ToothZone.MESIAL, color: '#c72ef1ff' }),
                expect.objectContaining({ zone: ToothZone.MESIO_PALATAL_CUSP, color: '#c72ef1ff' }),
            ])
        );
    });
});
