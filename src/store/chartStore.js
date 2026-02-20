import { create } from 'zustand';
import { produce } from 'immer';
import usePatientStore from './patientStore';

const useChartStore = create((set, get) => ({
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
        set(produce((state) => {
            const currentTooth = state.teeth[toothNumber];
            if (!currentTooth) return;

            // Apply all passed updates by mutating the draft
            Object.assign(currentTooth, updates);
        }));

        const patientStore = usePatientStore.getState();
        if (patientStore.selectedPatient) {
            patientStore.updatePatient({
                ...patientStore.selectedPatient,
                chart: {
                    ...patientStore.selectedPatient.chart,
                    teeth: get().teeth // Finalized object, not an Immer draft
                }
            });
        }
    },
    updateTeeth: (updates) => {
        set(produce((state) => {
            Object.keys(updates).forEach(toothNumber => {
                if (state.teeth[toothNumber]) {
                    Object.assign(state.teeth[toothNumber], updates[toothNumber]);
                }
            });
        }));

        const patientStore = usePatientStore.getState();
        if (patientStore.selectedPatient) {
            patientStore.updatePatient({
                ...patientStore.selectedPatient,
                chart: {
                    ...patientStore.selectedPatient.chart,
                    teeth: get().teeth // Finalized object, not an Immer draft
                }
            });
        }
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
}));

export default useChartStore;
