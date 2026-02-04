import { create } from 'zustand';

const usePatientStore = create((set) => ({
    patients: [],
    selectedPatient: null,
    searchQuery: '',

    setPatients: (patients) => set({ patients }),
    selectPatient: (patient) => set({ selectedPatient: patient }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    addPatient: (patient) => set((state) => ({ patients: [...state.patients, patient] })),
    updatePatient: (updatedPatient) => set((state) => ({
        patients: state.patients.map(p => p.id === updatedPatient.id ? updatedPatient : p),
        selectedPatient: state.selectedPatient?.id === updatedPatient.id ? updatedPatient : state.selectedPatient
    })),
    addTreatmentPlanItem: (patientId, item) => set((state) => {
        const patients = state.patients.map(p => {
            if (p.id === patientId) {
                const newItem = { ...item, id: Date.now().toString() };
                const updatedPatient = {
                    ...p,
                    treatmentPlan: {
                        ...p.treatmentPlan,
                        items: [...(p.treatmentPlan?.items || []), newItem]
                    }
                };
                return updatedPatient;
            }
            return p;
        });
        const selectedPatient = state.selectedPatient?.id === patientId
            ? patients.find(p => p.id === patientId)
            : state.selectedPatient;
        return { patients, selectedPatient };
    }),
    completeTreatmentPlanItem: (patientId, itemId) => set((state) => {
        const patients = state.patients.map(p => {
            if (p.id === patientId) {
                const itemToComplete = p.treatmentPlan.items.find(i => i.id === itemId);
                if (!itemToComplete) return p;

                const updatedTreatmentPlan = {
                    ...p.treatmentPlan,
                    items: p.treatmentPlan.items.filter(i => i.id !== itemId)
                };
                const updatedHistory = {
                    ...p.history,
                    completedItems: [
                        ...(p.history?.completedItems || []),
                        {
                            ...itemToComplete,
                            date: new Date().toISOString().split('T')[0],
                            status: 'completed'
                        }
                    ]
                };
                return { ...p, treatmentPlan: updatedTreatmentPlan, history: updatedHistory };
            }
            return p;
        });
        const selectedPatient = state.selectedPatient?.id === patientId
            ? patients.find(p => p.id === patientId)
            : state.selectedPatient;
        return { patients, selectedPatient };
    }),
    addToHistory: (patientId, item) => set((state) => {
        const patients = state.patients.map(p => {
            if (p.id === patientId) {
                const updatedHistory = {
                    ...p.history,
                    completedItems: [
                        ...(p.history?.completedItems || []),
                        {
                            ...item,
                            id: Date.now().toString(),
                            date: new Date().toISOString().split('T')[0],
                            status: 'completed'
                        }
                    ]
                };
                return { ...p, history: updatedHistory };
            }
            return p;
        });
        const selectedPatient = state.selectedPatient?.id === patientId
            ? patients.find(p => p.id === patientId)
            : state.selectedPatient;
        return { patients, selectedPatient };
    }),
}));

export default usePatientStore;
