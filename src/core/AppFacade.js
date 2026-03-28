import { useAppStore } from './store/appStore';
import { ActionProxy } from './proxies/ActionProxy';
import { PatientAdapter } from './adapters/PatientAdapter';
import { patientService } from '../api';

/**
 * AppFacade acts as a central access point for the UI.
 * React Components should use Context or Hooks to access data,
 * but for executing complex Actions, they interact with the Facade.
 */
export const AppFacade = {
    patient: {
        /**
         * Load all patients for a medic
         */
        loadAll: async (medicId) => {
            try {
                const apiPatients = await patientService.getPatients(medicId);
                const domainPatients = apiPatients.map(p => PatientAdapter.toDomain(p));
                useAppStore.getState().setPatients(domainPatients);
                return domainPatients;
            } catch (error) {
                console.error("[AppFacade] Failed to load patients", error);
                throw error;
            }
        },

        /**
         * Load a single patient by ID
         */
        loadOne: async (id) => {
            try {
                const response = await patientService.getPatient(id);
                const domainPatient = PatientAdapter.toDomain(response);
                useAppStore.getState().selectPatient(domainPatient);
                return domainPatient;
            } catch (error) {
                console.error("[AppFacade] Failed to load patient", error);
                throw error;
            }
        },

        /**
         * Load full patient data (including chart)
         */
        loadFull: async (id) => {
            console.log(`[AppFacade] loadFull initiated for ${id}`);
            try {
                const response = await patientService.getPatientFull(id);
                console.log(`[AppFacade] loadFull received response for ${id}:`, response);
                const domainPatient = PatientAdapter.toDomain(response);
                console.log(`[AppFacade] loadFull adapted domain patient:`, domainPatient);
                
                // Sync charts/teeth state if present
                if (domainPatient.chart?.teeth) {
                    console.log(`[AppFacade] loadFull syncing teeth data`);
                    useAppStore.getState().setTeeth(domainPatient.chart.teeth);
                }
                
                useAppStore.getState().selectPatient(domainPatient);
                return domainPatient;
            } catch (error) {
                console.error("[AppFacade] Failed to load full patient data", error);
                throw error;
            }
        },

        /**
         * Select a patient
         */
        select: (patient) => useAppStore.getState().selectPatient(patient),

        /**
         * Search patients
         */
        setSearchQuery: (query) => {
            useAppStore.getState().setSearchQuery(query);
        },

        /**
         * Add a new patient record
         */
        add: async (patientData, medicId) => {
            try {
                const payload = {
                    ...patientData,
                    medicId,
                    lastExamDate: 'N/A',
                    treatmentPlan: { items: [] },
                    history: { completedItems: [] }
                };
                
                const response = await patientService.createPatient(PatientAdapter.toApi(payload));
                const domainPatient = PatientAdapter.toDomain(response);
                useAppStore.getState().addPatient(domainPatient);
                return domainPatient;
            } catch (error) {
                console.error("[AppFacade] Failed to add patient", error);
                throw error;
            }
        },

        /**
         * Update an existing patient record
         */
        update: async (id, patientData) => {
            try {
                const response = await patientService.updatePatient(id, PatientAdapter.toApi(patientData));
                const domainPatient = PatientAdapter.toDomain(response);
                useAppStore.getState().updatePatient(domainPatient);
                return domainPatient;
            } catch (error) {
                console.error("[AppFacade] Failed to update patient", error);
                throw error;
            }
        },

        /**
         * Delete a patient record
         */
        delete: async (id) => {
            try {
                await patientService.deletePatient(id);
                useAppStore.getState().deletePatient(id);
            } catch (error) {
                console.error("[AppFacade] Failed to delete patient", error);
                throw error;
            }
        },

        /**
         * Complex business flow: mark treatment plan item as complete.
         */
        completeTreatment: async (patientId, itemId) => {
            const store = useAppStore.getState();
            store.completeTreatmentPlanItem(patientId, itemId);
            
            // Persist the entire updated patient state
            if (store.selectedPatient) {
                return await AppFacade.patient.update(patientId, store.selectedPatient);
            }
        },

        /**
         * Add an item directly to history
         */
        addToHistory: async (patientId, item) => {
            const store = useAppStore.getState();
            store.addToHistory(patientId, item);

            if (store.selectedPatient) {
                return await AppFacade.patient.update(patientId, store.selectedPatient);
            }
        },

        /**
         * Add a new treatment plan item
         */
        addTreatmentPlanItem: async (patientId, item) => {
            const store = useAppStore.getState();
            store.addTreatmentPlanItem(patientId, item);

            if (store.selectedPatient) {
                return await AppFacade.patient.update(patientId, store.selectedPatient);
            }
        },

        /**
         * Get selected patient helper
         */
        getSelected: () => useAppStore.getState().selectedPatient
    },

    chart: {
        updateTooth: async (toothNumber, updates) => {
            const store = useAppStore.getState();
            store.updateTooth(toothNumber, updates);
            
            const patient = store.selectedPatient;
            if (patient) {
                // Ensure chart object exists
                const updatedPatient = {
                    ...patient,
                    chart: {
                        ...(patient.chart || {}),
                        teeth: store.teeth
                    }
                };
                await AppFacade.patient.update(patient.id, updatedPatient);
            }
        },

        updateTeethBatch: async (updates) => {
            const store = useAppStore.getState();
            store.updateTeeth(updates);

            const patient = store.selectedPatient;
            if (patient) {
                const updatedPatient = {
                    ...patient,
                    chart: {
                        ...(patient.chart || {}),
                        teeth: store.teeth
                    }
                };
                await AppFacade.patient.update(patient.id, updatedPatient);
            }
        }
    }
};
