import { useAppStore } from './store/appStore';
import { ActionProxy } from './proxies/ActionProxy';
import { BackendSyncStrategy } from './strategies/BackendSyncStrategy';
import { PatientAdapter } from './adapters/PatientAdapter';

const syncStrategy = new BackendSyncStrategy();

/**
 * AppFacade acts as a central access point for the UI.
 * React Components should use Context or Hooks to access data,
 * but for executing complex Actions, they interact with the Facade.
 * 
 * This completely decouples React from Zustand and our raw Models/Adapters.
 */
export const AppFacade = {
    patient: {
        /**
         * Gets all patients (convenience method, though UI mostly uses hooks for reactivity)
         */
        getAll: () => useAppStore.getState().patients,

        /**
         * Gets the currently selected patient
         */
        getSelected: () => useAppStore.getState().selectedPatient,

        /**
         * Select a patient
         */
        select: (patient) => useAppStore.getState().selectPatient(patient),

        /**
         * Search patients
         */
        setSearchQuery: ActionProxy.debounceSync((query) => {
            useAppStore.getState().setSearchQuery(query);
        }, 300),

        /**
         * Add a new patient record
         */
        add: (patient) => {
            useAppStore.getState().addPatient(patient);

            // Normalize before sending to API
            const payload = PatientAdapter.toApi(patient);
            syncStrategy.sendUpdate('ADD_PATIENT', payload);
        },

        /**
         * Update an existing patient record
         */
        update: (patient) => {
            useAppStore.getState().updatePatient(patient);
        },

        /**
         * Complex business flow: mark treatment plan item as complete.
         */
        completeTreatment: ActionProxy.withLogging(
            (patientId, itemId) => {
                useAppStore.getState().completeTreatmentPlanItem(patientId, itemId);
            },
            'AppFacade.patient.completeTreatment'
        )
    },

    // Future expansion:
    // chart: { ... }
};
