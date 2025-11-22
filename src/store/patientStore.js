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
}));

export default usePatientStore;
