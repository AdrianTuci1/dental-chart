import { produce } from 'immer';
import { PatientModel } from '../../models/PatientModel';
import { ChartModel } from '../../models/ChartModel';
import { resolveDentition } from '../../../utils/toothUtils';
// import { ActionProxy } from '../../proxies/ActionProxy'; // Future use

const syncSelectedPatientChart = (state) => {
    if (!state.selectedPatient) return;

    if (!state.selectedPatient.chart) {
        state.selectedPatient.chart = { teeth: {} };
    }

    state.selectedPatient.chart.teeth = state.teeth;
    state.resolvedTeeth = resolveDentition(state.teeth);
};

const reprojectSelectedPatientTeeth = (state, patientId) => {
    if (String(state.selectedPatient?.id) !== String(patientId)) return;

    const baseTeeth = Object.keys(state.teeth || {}).length > 0
        ? state.teeth
        : state.selectedPatient?.chart?.teeth || null;

    state.teeth = ChartModel.projectTeethFromInterventions(
        state.selectedPatient.history?.completedItems || [],
        state.selectedPatient.treatmentPlan?.items || [],
        baseTeeth
    );

    syncSelectedPatientChart(state);
};

/**
 * Zustand Slice for Patient domain.
 * Dumb container: only holds state and delegates business logic to `PatientModel`.
 * 
 * @param {Function} set - Zustand setter
 * @param {Function} get - Zustand getter
 */
export const createPatientSlice = (set) => ({
    patients: [],
    selectedPatient: null,
    searchQuery: '',
    isSyncing: false,

    // Basic actions
    setPatients: (patients) => set({ patients }),
    selectPatient: (patient) => set({ selectedPatient: patient }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setIsSyncing: (isSyncing) => set({ isSyncing }),

    addPatient: (patient) => set(produce((state) => {
        state.patients.push(patient);
    })),

    updatePatient: (updatedPatient) => {
        set(produce((state) => {
            const pIndex = state.patients.findIndex(p => p.id === updatedPatient.id);
            if (pIndex !== -1) {
                state.patients[pIndex] = updatedPatient;
            }
            if (state.selectedPatient?.id === updatedPatient.id) {
                state.selectedPatient = updatedPatient;
                if (updatedPatient.chart?.teeth) {
                    state.teeth = updatedPatient.chart.teeth;
                    state.resolvedTeeth = resolveDentition(state.teeth);
                }
            }
        }));
    },

    deletePatient: (id) => {
        set(produce((state) => {
            state.patients = state.patients.filter(p => p.id !== id);
            if (state.selectedPatient?.id === id) {
                state.selectedPatient = null;
            }
        }));
    },

    // Complex domain actions delegated to Model
    addTreatmentPlanItem: (patientId, item) => set(produce((state) => {
        let patient = state.patients.find(p => p.id === patientId);
        
        // Ensure selectedPatient is also updated if it matches, even if patients array is empty (e.g. on direct nav)
        if (!patient && state.selectedPatient?.id === patientId) {
            patient = state.selectedPatient;
        } else if (patient && state.selectedPatient?.id === patientId) {
            state.selectedPatient = patient; // Keep them synced
        }

        if (patient) {
            const newItem = { ...item, id: item.id || Date.now().toString() };
            if (!patient.treatmentPlan) patient.treatmentPlan = { items: [] };
            if (!patient.treatmentPlan.items) patient.treatmentPlan.items = [];
            patient.treatmentPlan.items.push(newItem);
        }

        reprojectSelectedPatientTeeth(state, patientId);
    })),

    completeTreatmentPlanItem: (patientId, itemId) => {
        set(produce((state) => {
            let patient = state.patients.find(p => p.id === patientId);
            
            if (!patient && state.selectedPatient?.id === patientId) {
                patient = state.selectedPatient;
            } else if (patient && state.selectedPatient?.id === patientId) {
                state.selectedPatient = patient;
            }

            if (patient) {
                PatientModel.completeTreatment(patient, itemId);
            }

            reprojectSelectedPatientTeeth(state, patientId);
        }));
    },

    addToHistory: (patientId, item) => {
        set(produce((state) => {
            let patient = state.patients.find(p => p.id === patientId);
            
            if (!patient && state.selectedPatient?.id === patientId) {
                patient = state.selectedPatient;
            } else if (patient && state.selectedPatient?.id === patientId) {
                state.selectedPatient = patient;
            }

            if (patient) {
                PatientModel.addToHistory(patient, item);
            }

            reprojectSelectedPatientTeeth(state, patientId);
        }));
    },
});
