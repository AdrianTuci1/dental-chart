import { produce } from 'immer';
import { PatientModel } from '../../models/PatientModel';
// import { ActionProxy } from '../../proxies/ActionProxy'; // Future use

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

    // Basic actions
    setPatients: (patients) => set({ patients }),
    selectPatient: (patient) => set({ selectedPatient: patient }),
    setSearchQuery: (query) => set({ searchQuery: query }),

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
        const patient = state.patients.find(p => p.id === patientId);
        if (patient) {
            const newItem = { ...item, id: item.id || Date.now().toString() };
            if (!patient.treatmentPlan) patient.treatmentPlan = { items: [] };
            if (!patient.treatmentPlan.items) patient.treatmentPlan.items = [];
            patient.treatmentPlan.items.push(newItem);
        }

        if (state.selectedPatient?.id === patientId) {
            // Keep selected patient reference in sync
            state.selectedPatient = state.patients.find(p => p.id === patientId);
        }
    })),

    completeTreatmentPlanItem: (patientId, itemId) => {
        // Delegate logic to PatientModel using Immer's produce via set()
        set(produce((state) => {
            const patient = state.patients.find(p => p.id === patientId);
            if (patient) {
                PatientModel.completeTreatment(patient, itemId);
            }
            if (state.selectedPatient?.id === patientId) {
                state.selectedPatient = patient;
            }
        }));
    },

    addToHistory: (patientId, item) => {
        set(produce((state) => {
            const patient = state.patients.find(p => p.id === patientId);
            if (patient) {
                PatientModel.addToHistory(patient, item);
            }
            if (state.selectedPatient?.id === patientId) {
                state.selectedPatient = patient;
            }
        }));
    },
});
