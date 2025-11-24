import { create } from 'zustand';

const useChartStore = create((set) => ({
    teeth: {}, // Map of toothNumber -> Tooth object
    selectedTooth: null,
    chartView: 'normal', // 'normal', 'upper', or 'lower'
    viewMode: 'overview', // 'overview', 'endo', 'perio', 'restoration'
    historicalDate: null,
    showEndo: true,
    showPerio: true,
    showDental: true,

    setTeeth: (teeth) => set({ teeth }),
    updateTooth: (toothNumber, updates) => set((state) => {
        const currentTooth = state.teeth[toothNumber];
        if (!currentTooth) return state;

        // Create a new instance with the same prototype
        const updatedTooth = Object.assign(
            Object.create(Object.getPrototypeOf(currentTooth)),
            currentTooth,
            updates
        );

        return {
            teeth: {
                ...state.teeth,
                [toothNumber]: updatedTooth
            }
        };
    }),
    updateTeeth: (updates) => set((state) => {
        const newTeeth = { ...state.teeth };
        Object.keys(updates).forEach(toothNumber => {
            if (newTeeth[toothNumber]) {
                newTeeth[toothNumber] = Object.assign(
                    Object.create(Object.getPrototypeOf(newTeeth[toothNumber])),
                    newTeeth[toothNumber],
                    updates[toothNumber]
                );
            }
        });
        return { teeth: newTeeth };
    }),
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
