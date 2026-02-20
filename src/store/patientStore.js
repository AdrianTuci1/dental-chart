import { create } from 'zustand';
import { produce } from 'immer';

const usePatientStore = create((set) => ({
    patients: [],
    selectedPatient: null,
    searchQuery: '',

    setPatients: (patients) => set({ patients }),
    selectPatient: (patient) => set({ selectedPatient: patient }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    addPatient: (patient) => set(produce((state) => {
        state.patients.push(patient);
    })),
    updatePatient: (updatedPatient) => set(produce((state) => {
        const pIndex = state.patients.findIndex(p => p.id === updatedPatient.id);
        if (pIndex !== -1) {
            state.patients[pIndex] = updatedPatient;
        }
        if (state.selectedPatient?.id === updatedPatient.id) {
            state.selectedPatient = updatedPatient;
        }
    })),
    addTreatmentPlanItem: (patientId, item) => set(produce((state) => {
        const patient = state.patients.find(p => p.id === patientId);
        if (patient) {
            const newItem = { ...item, id: item.id || Date.now().toString() };
            if (!patient.treatmentPlan) patient.treatmentPlan = { items: [] };
            if (!patient.treatmentPlan.items) patient.treatmentPlan.items = [];
            patient.treatmentPlan.items.push(newItem);
        }

        if (state.selectedPatient?.id === patientId) {
            state.selectedPatient = state.patients.find(p => p.id === patientId);
        }
    })),
    completeTreatmentPlanItem: (patientId, itemId) => set(produce((state) => {
        const patient = state.patients.find(p => p.id === patientId);
        if (!patient || !patient.treatmentPlan?.items) return;

        const itemIndex = patient.treatmentPlan.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;

        const itemToComplete = patient.treatmentPlan.items[itemIndex];
        const currentDate = new Date().toISOString().split('T')[0];

        // 1. Remove from treatment plan
        patient.treatmentPlan.items.splice(itemIndex, 1);

        // 2. Add to history
        if (!patient.history) patient.history = { completedItems: [] };
        if (!patient.history.completedItems) patient.history.completedItems = [];
        patient.history.completedItems.push({
            ...itemToComplete,
            date: currentDate,
            status: 'completed'
        });

        // 3. UPDATE VIRTUAL TOOTH ITEM IF IT HAS THE SAME ID
        if (patient.chart?.teeth && itemToComplete.tooth) {
            const tooth = patient.chart.teeth[itemToComplete.tooth];
            if (tooth) {
                const fullIsoDate = new Date().toISOString();
                const markDone = (itemsArray) => {
                    if (!itemsArray) return;
                    for (let obj of itemsArray) {
                        if (obj.id === itemId) {
                            obj.status = 'completed';
                            obj.date = fullIsoDate;
                        }
                    }
                };

                if (tooth.restoration) {
                    markDone(tooth.restoration.fillings);
                    markDone(tooth.restoration.veneers);
                    markDone(tooth.restoration.crowns);
                    markDone(tooth.restoration.advancedRestorations);
                }

                if (tooth.pathology) {
                    markDone(tooth.pathology.decay);
                    if (tooth.pathology.fracture?.id === itemId) {
                        tooth.pathology.fracture.status = 'completed';
                        tooth.pathology.fracture.date = fullIsoDate;
                    }
                    if (tooth.pathology.toothWear?.id === itemId) {
                        tooth.pathology.toothWear.status = 'completed';
                        tooth.pathology.toothWear.date = fullIsoDate;
                    }
                    if (tooth.pathology.discoloration?.id === itemId) {
                        tooth.pathology.discoloration.status = 'completed';
                        tooth.pathology.discoloration.date = fullIsoDate;
                    }
                    if (tooth.pathology.apicalPathology?.id === itemId) {
                        tooth.pathology.apicalPathology.status = 'completed';
                        tooth.pathology.apicalPathology.date = fullIsoDate;
                    }
                    if (tooth.pathology.developmentDisorder?.id === itemId) {
                        tooth.pathology.developmentDisorder.status = 'completed';
                        tooth.pathology.developmentDisorder.date = fullIsoDate;
                    }
                }
            }
        }

        if (state.selectedPatient?.id === patientId) {
            state.selectedPatient = patient;
        }
    })),
    addToHistory: (patientId, item) => set(produce((state) => {
        const patient = state.patients.find(p => p.id === patientId);
        if (patient) {
            if (!patient.history) patient.history = { completedItems: [] };
            if (!patient.history.completedItems) patient.history.completedItems = [];

            patient.history.completedItems.push({
                ...item,
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                status: 'completed'
            });
        }

        if (state.selectedPatient?.id === patientId) {
            state.selectedPatient = patient;
        }
    })),
}));

export default usePatientStore;
