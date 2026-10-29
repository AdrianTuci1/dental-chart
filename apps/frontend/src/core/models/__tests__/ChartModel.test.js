import { describe, expect, it } from 'vitest';
import { ChartModel } from '../ChartModel';
import { ToothModel } from '../ToothModel';
import { PatientModel } from '../PatientModel';

describe('ChartModel.projectTeethFromInterventions', () => {
    it('preserves base tooth state while projecting all documented sync subtypes', () => {
        const baseTooth = ToothModel.create(11);
        baseTooth.endodontic.hasRootCanal = true;
        baseTooth.developmentState = 'baby tooth';
        baseTooth.pathology.discoloration = { id: 'disc-legacy', color: 'Gray', status: 'planned' };

        const teeth = ChartModel.projectTeethFromInterventions(
            [
                {
                    id: 'hist-crown',
                    tooth: 11,
                    type: 'restoration',
                    subtype: 'crown',
                    material: 'Ceramic',
                    zones: ['Buccal', 'Occlusal', 'Palatal'],
                    crownType: 'Pontic',
                    base: 'Natural',
                    status: 'completed',
                },
                {
                    id: 'hist-fracture',
                    tooth: 11,
                    type: 'pathology',
                    subtype: 'fracture',
                    crown: true,
                    status: 'completed',
                },
                {
                    id: 'hist-endo',
                    tooth: 11,
                    type: 'endodontic',
                    hasRootCanal: true,
                    tests: {
                        cold: { result: 'Positive', detail: 'Within limits' },
                        electricity: 40,
                    },
                    status: 'completed',
                },
                {
                    id: 'hist-perio',
                    tooth: 11,
                    type: 'periodontal',
                    probingDepth: { buccal: 4 },
                    plaqueSites: ['buccal'],
                    mobility: 'Class 1',
                    status: 'completed',
                },
            ],
            [
                {
                    id: 'plan-veneer',
                    tooth: 11,
                    type: 'restoration',
                    subtype: 'veneer',
                    material: 'Ceramic',
                    status: 'planned',
                },
                {
                    id: 'plan-inlay',
                    tooth: 11,
                    type: 'restoration',
                    subtype: 'inlay',
                    material: 'Gold',
                    zones: ['Occlusal'],
                    status: 'planned',
                },
                {
                    id: 'plan-wear',
                    tooth: 11,
                    type: 'pathology',
                    subtype: 'tooth-wear',
                    wearType: 'abrasion',
                    surface: 'buccal',
                    status: 'planned',
                },
                {
                    id: 'plan-apical',
                    tooth: 11,
                    type: 'pathology',
                    subtype: 'apical',
                    present: true,
                    status: 'planned',
                },
                {
                    id: 'plan-development',
                    tooth: 11,
                    type: 'pathology',
                    subtype: 'development-disorder',
                    present: true,
                    status: 'planned',
                },
            ],
            { 11: baseTooth }
        );

        expect(teeth[11].endodontic.hasRootCanal).toBe(true);
        expect(teeth[11].developmentState).toBe('baby tooth');
        expect(teeth[11].restoration.crowns).toHaveLength(1);
        expect(teeth[11].restoration.crowns[0].type).toBe('Pontic');
        expect(teeth[11].restoration.crowns[0].zones).toEqual(['Buccal', 'Occlusal', 'Palatal']);
        expect(teeth[11].restoration.veneers[0].id).toBe('plan-veneer');
        expect(teeth[11].restoration.advancedRestorations[0].type).toBe('inlay');
        expect(teeth[11].pathology.fracture.crown).toBe(true);
        expect(teeth[11].pathology.toothWear.type).toBe('Abrasion');
        expect(teeth[11].pathology.apicalPathology.present).toBe(true);
        expect(teeth[11].pathology.developmentDisorder.present).toBe(true);
        expect(teeth[11].periodontal.sites.buccal.plaque).toBe(true);
        expect(teeth[11].periodontal.mobility).toBe('Class 1');
        expect(teeth[11].pathology.discoloration.color).toBe('Gray');
    });

    it('upserts projected items by id instead of duplicating them', () => {
        const baseTooth = ToothModel.create(21);
        baseTooth.restoration.fillings = [
            { id: 'fill-1', material: 'Composite', zones: ['Mesial'], status: 'planned' },
        ];

        const teeth = ChartModel.projectTeethFromInterventions(
            [],
            [
                {
                    id: 'fill-1',
                    tooth: 21,
                    type: 'restoration',
                    subtype: 'filling',
                    material: 'Gold',
                    zones: ['Distal'],
                    status: 'completed',
                },
            ],
            { 21: baseTooth }
        );

        expect(teeth[21].restoration.fillings).toHaveLength(1);
        expect(teeth[21].restoration.fillings[0]).toMatchObject({
            id: 'fill-1',
            material: 'Gold',
            zones: ['Distal'],
            status: 'completed',
        });
    });
});

describe('ToothModel.update', () => {
    it('updates root-level sync fields and deep-merges test payloads', () => {
        const tooth = ToothModel.create(31);

        ToothModel.update(tooth, {
            isMissing: true,
            developmentState: 'adult tooth missing',
            endodontic: {
                tests: {
                    heat: 'normal',
                },
            },
        });

        expect(tooth.isMissing).toBe(true);
        expect(tooth.developmentState).toBe('adult tooth missing');
        expect(tooth.endodontic.tests.heat).toBe('normal');
        expect(tooth.endodontic.tests.cold).toBe(null);
    });
});

describe('PatientModel.addToHistory', () => {
    it('preserves explicit history metadata coming from synced feature actions', () => {
        const patient = {
            history: {
                completedItems: [],
            },
        };

        PatientModel.addToHistory(patient, {
            id: 'history-1',
            date: '2026-03-29',
            status: 'completed',
            procedure: 'Composite Filling',
        });

        expect(patient.history.completedItems).toEqual([
            {
                id: 'history-1',
                date: '2026-03-29',
                status: 'completed',
                procedure: 'Composite Filling',
            },
        ]);
    });
});
