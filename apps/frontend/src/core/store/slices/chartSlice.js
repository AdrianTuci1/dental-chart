import { produce } from 'immer';
import { ChartModel } from '../../models/ChartModel';
import { ToothModel } from '../../models/ToothModel';
import { resolveDentition } from '../../../utils/toothUtils';

const syncSelectedPatientChart = (state) => {
    if (!state.selectedPatient) return;

    if (!state.selectedPatient.chart) {
        state.selectedPatient.chart = { teeth: {} };
    }

    state.selectedPatient.chart.teeth = state.teeth;
    state.resolvedTeeth = resolveDentition(state.teeth);
};

export const createChartSlice = (set) => ({
    teeth: {}, // Map of toothNumber -> Tooth object
    resolvedTeeth: {}, // Computed Map of permanent array indices -> display tooth info
    previewTeeth: {}, // Live preview data from drawers
    selectedTooth: null,
    chartView: 'normal', // 'normal', 'upper', or 'lower'
    viewMode: 'overview', // 'overview', 'endo', 'perio', 'restoration'
    historicalDate: null,
    showEndo: true,
    showPerio: true,
    showDental: true,

    setTeeth: (teeth) => set(produce((state) => {
        state.teeth = teeth || {};
        syncSelectedPatientChart(state);
    })),
    updateTooth: (toothNumber, updates) => {
        set(produce((state) => {
            ChartModel.updateTooth(state, toothNumber, updates);
            syncSelectedPatientChart(state);
        }));
    },
    updateTeeth: (updates) => {
        set(produce((state) => {
            ChartModel.updateTeeth(state, updates);
            syncSelectedPatientChart(state);
        }));
    },
    resetTeeth: (toothNumbers) => {
        set(produce((state) => {
            toothNumbers.forEach(num => {
                state.teeth[num] = ToothModel.create(num);
            });
            syncSelectedPatientChart(state);
        }));
    },
    setPreviewTooth: (toothNumber, previewData) => set(produce((state) => {
        if (previewData) {
            state.previewTeeth[toothNumber] = previewData;
        } else {
            delete state.previewTeeth[toothNumber];
        }
    })),
    selectTooth: (toothNumber) => set({ selectedTooth: toothNumber }),
    setChartView: (view) => set({ chartView: view }),
    setViewMode: (mode) => set({ viewMode: mode }),
    setHistoricalDate: (date) => set({ historicalDate: date }),
    toggleLayer: (layer) => set((state) => {
        if (layer === 'endo') return { showEndo: !state.showEndo };
        if (layer === 'perio') return { showPerio: !state.showPerio };
        if (layer === 'dental') return { showDental: !state.showDental };
        return state;
    }),
});
