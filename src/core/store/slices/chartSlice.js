import { produce } from 'immer';
import { ChartModel } from '../../models/ChartModel';


export const createChartSlice = (set, get) => ({
    teeth: {}, // Map of toothNumber -> Tooth object
    selectedTooth: null,
    chartView: 'normal', // 'normal', 'upper', or 'lower'
    viewMode: 'overview', // 'overview', 'endo', 'perio', 'restoration'
    historicalDate: null,
    showEndo: true,
    showPerio: true,
    showDental: true,

    setTeeth: (teeth) => set({ teeth }),
    updateTooth: (toothNumber, updates) => {
        console.log(`[chartSlice] updateTooth called for ${toothNumber} with updates:`, updates);
        set(produce((state) => {
            ChartModel.updateTooth(state, toothNumber, updates);
        }));
        console.log(`[chartSlice] after updateTooth for ${toothNumber}, new teeth object:`, get().teeth[toothNumber]);

        // CROSS-SLICE UPDATES SHOULD BE HANDLED BY THE FACADE, NOT THE SLICE
        // TO PREVENT CIRCULAR DEPENDENCIES
    },
    updateTeeth: (updates) => {
        set(produce((state) => {
            ChartModel.updateTeeth(state, updates);
        }));
    },
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
