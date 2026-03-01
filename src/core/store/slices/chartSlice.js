import { produce } from 'immer';
import { AppFacade } from '../../AppFacade';
import { ChartModel } from '../../models/ChartModel';
import { BackendSyncStrategy } from '../../strategies/BackendSyncStrategy';

const syncStrategy = new BackendSyncStrategy();

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
        // The original log was: console.log(`[chartSlice] after updateTooth for ${toothNumber}, new teeth object:`, get().teeth[toothNumber]);
        // The user's edit was malformed, but the intent seems to be to log the state after update.
        // Keeping the original log as it correctly reflects the state after the update.
        console.log(`[chartSlice] after updateTooth for ${toothNumber}, new teeth object:`, get().teeth[toothNumber]);

        const patient = AppFacade.patient.getSelected();
        if (patient) {
            AppFacade.patient.update({
                ...patient,
                chart: {
                    ...patient.chart,
                    teeth: get().teeth // Finalized object, not an Immer draft
                }
            });
        }

        // Trigger sync update via Strategy
        syncStrategy.sendUpdate('UPDATE_TOOTH', {
            patientId: patient?.id,
            toothNumber,
            updates
        });
    },
    updateTeeth: (updates) => {
        set(produce((state) => {
            ChartModel.updateTeeth(state, updates);
        }));

        const patient = AppFacade.patient.getSelected();
        if (patient) {
            AppFacade.patient.update({
                ...patient,
                chart: {
                    ...patient.chart,
                    teeth: get().teeth // Finalized object, not an Immer draft
                }
            });
        }

        // Trigger sync update via Strategy
        syncStrategy.sendUpdate('UPDATE_TEETH_BATCH', {
            patientId: patient?.id,
            updates
        });
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
