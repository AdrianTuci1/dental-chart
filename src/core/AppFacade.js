import { useAppStore } from './store/appStore';
import { PatientAdapter } from './adapters/PatientAdapter';
import { patientService, medicService, clinicService, aiService } from '../api';
import { ActionProxy } from './proxies/ActionProxy';
import { ChartModel } from './models/ChartModel';
import { AIAdapter } from './adapters/AIAdapter';
import { AnalyticsFacade } from './analytics';

import { PatientModel } from './models/PatientModel';

const getStoreState = () => useAppStore.getState();

const getStoredPatientById = (id) => {
    const state = getStoreState();

    if (String(state.selectedPatient?.id) === String(id)) {
        return state.selectedPatient;
    }

    return state.patients.find((patient) => String(patient.id) === String(id)) || null;
};

const hydratePatient = (patient) => {
    if (!patient) return null;

    const teeth = ChartModel.projectTeethFromInterventions(
        patient.history?.completedItems || [],
        patient.treatmentPlan?.items || [],
        patient.chart?.teeth || {}
    );

    return {
        ...patient,
        chart: {
            ...(patient.chart || {}),
            teeth,
        },
    };
};

const storeHydratedPatient = (patient, { select = false } = {}) => {
    if (!patient) return null;

    const state = getStoreState();
    state.updatePatient(patient);

    if (select) {
        state.selectPatient(patient);
    }

    if (String(state.selectedPatient?.id) === String(patient.id) || select) {
        state.setTeeth(patient.chart?.teeth || {});
    }

    return patient;
};

const composePersistablePatient = (id, patientData = null) => {
    const state = getStoreState();
    const existingPatient = getStoredPatientById(id);

    if (!existingPatient && !patientData) {
        throw new Error(`Patient ${id} not found in local state`);
    }

    let mergedPatient = existingPatient
        ? { ...existingPatient, ...(patientData || {}) }
        : { id, ...(patientData || {}) };

    const isSelectedPatient = String(state.selectedPatient?.id) === String(id);
    const existingChart = existingPatient?.chart || {};
    const incomingChart = patientData?.chart || mergedPatient.chart || {};

    mergedPatient = {
        ...mergedPatient,
        chart: {
            ...existingChart,
            ...incomingChart,
        },
    };

    if (isSelectedPatient) {
        mergedPatient.chart.teeth = state.teeth;
    }

    return mergedPatient;
};

/**
 * AppFacade acts as a central access point for the UI.
 * React components interact with the facade for loading and persisting
 * patient/chart state so every feature uses the same sync pipeline.
 */
export const AppFacade = {
    analytics: {
        setUser: (user) => AnalyticsFacade.setUser(user),
        pageViewed: (pathname) => AnalyticsFacade.trackPageView(pathname),
        sessionStarted: (pathname) => AnalyticsFacade.trackSessionStarted(pathname),
        sessionHeartbeat: (pathname) => AnalyticsFacade.trackSessionHeartbeat(pathname),
        visibilityChanged: (state, pathname) => AnalyticsFacade.trackVisibilityChange(state, pathname),
        loginCompleted: ({ id, subscriptionPlan }) => AnalyticsFacade.trackLoginCompleted({ id, subscriptionPlan }),
        onboardingCompleted: ({ id, subscriptionPlan }) => AnalyticsFacade.trackOnboardingCompleted({ id, subscriptionPlan }),
        settingsOpened: (medicId) => AnalyticsFacade.trackSettingsOpened(medicId),
        menuClicked: ({ patientId, menuName }) => AnalyticsFacade.trackMenuClicked({ patientId, menuName }),
    },

    medic: {
        updateProfile: async (medicId, payload) => {
            try {
                const response = await medicService.updateMedic(medicId, payload);
                getStoreState().updateMedicProfile(response);
                return response;
            } catch (error) {
                console.error('[AppFacade] Failed to update medic profile', error);
                throw error;
            }
        },

        rotateApiKey: async (medicId) => {
            try {
                const response = await medicService.rotateApiKey(medicId);
                const { apiKey, ...persistedProfile } = response || {};
                getStoreState().updateMedicProfile(persistedProfile);
                return response;
            } catch (error) {
                console.error('[AppFacade] Failed to rotate API key', error);
                throw error;
            }
        },
    },

    clinic: {
        getPendingInvitations: async () => {
            try {
                return await clinicService.getPendingInvitations();
            } catch (error) {
                console.error('[AppFacade] Failed to load pending invitations', error);
                throw error;
            }
        },

        rename: async (clinicId, payload) => {
            try {
                return await clinicService.updateClinic(clinicId, payload);
            } catch (error) {
                console.error('[AppFacade] Failed to rename clinic', error);
                throw error;
            }
        },

        inviteMember: async (clinicId, payload) => {
            try {
                return await clinicService.inviteMedic(clinicId, payload);
            } catch (error) {
                console.error('[AppFacade] Failed to invite clinic member', error);
                throw error;
            }
        },

        acceptInvitation: async (clinicId, inviteId) => {
            try {
                return await clinicService.acceptInvitation(clinicId, inviteId);
            } catch (error) {
                console.error('[AppFacade] Failed to accept clinic invitation', error);
                throw error;
            }
        },

        removeMember: async (clinicId, medicId) => {
            try {
                return await clinicService.removeMember(clinicId, medicId);
            } catch (error) {
                console.error('[AppFacade] Failed to remove clinic member', error);
                throw error;
            }
        },

        transferOwnership: async (clinicId, newOwnerMedicId) => {
            try {
                return await clinicService.transferOwnership(clinicId, newOwnerMedicId);
            } catch (error) {
                console.error('[AppFacade] Failed to transfer clinic ownership', error);
                throw error;
            }
        },

        delete: async (clinicId) => {
            try {
                return await clinicService.deleteClinic(clinicId);
            } catch (error) {
                console.error('[AppFacade] Failed to delete clinic', error);
                throw error;
            }
        },
    },

    patient: {
        /**
         * Load all patients for a medic.
         */
        loadAll: async (medicId) => {
            try {
                const apiPatients = await patientService.getPatients(medicId);
                const domainPatients = apiPatients.map((patient) => PatientAdapter.toDomain(patient));
                getStoreState().setPatients(domainPatients);
                return domainPatients;
            } catch (error) {
                console.error('[AppFacade] Failed to load patients', error);
                throw error;
            }
        },

        /**
         * Load a single patient by ID.
         */
        loadOne: async (id) => {
            try {
                const response = await patientService.getPatient(id);
                const domainPatient = PatientAdapter.toDomain(response);
                getStoreState().selectPatient(domainPatient);
                return domainPatient;
            } catch (error) {
                console.error('[AppFacade] Failed to load patient', error);
                throw error;
            }
        },

        /**
         * Load the full patient record and hydrate chart state from both
         * explicit chart data and event-sourced interventions.
         */
        loadFull: async (id) => {
            try {
                const response = await patientService.getPatientFull(id);
                const domainPatient = hydratePatient(PatientAdapter.toDomain(response));
                return storeHydratedPatient(domainPatient, { select: true });
            } catch (error) {
                console.error('[AppFacade] Failed to load full patient data', error);
                throw error;
            }
        },

        /**
         * Select a patient.
         */
        select: (patient) => getStoreState().selectPatient(patient),

        /**
         * Search patients.
         */
        setSearchQuery: (query) => {
            getStoreState().setSearchQuery(query);
        },

        /**
         * Add a new patient record.
         */
        add: async (patientData, medicId) => {
            try {
                const payload = {
                    ...patientData,
                    medicId,
                    lastExamDate: 'N/A',
                    treatmentPlan: { items: [] },
                    history: { completedItems: [] },
                    chart: { teeth: {} },
                };

                const response = await patientService.createPatient(PatientAdapter.toApi(payload));
                const domainPatient = hydratePatient(PatientAdapter.toDomain(response));
                getStoreState().addPatient(domainPatient);
                return domainPatient;
            } catch (error) {
                console.error('[AppFacade] Failed to add patient', error);
                throw error;
            }
        },

        /**
         * Persist an existing patient using a single canonical payload shape.
         */
        update: async (id, patientData = null) => {
            try {
                const persistablePatient = composePersistablePatient(id, patientData);
                const response = await patientService.updatePatient(id, PatientAdapter.toApi(persistablePatient));
                const domainPatient = hydratePatient(PatientAdapter.toDomain(response));
                return storeHydratedPatient(domainPatient, {
                    select: String(getStoreState().selectedPatient?.id) === String(id),
                });
            } catch (error) {
                console.error('[AppFacade] Failed to update patient', error);
                throw error;
            }
        },

        /**
         * Delete a patient record.
         */
        delete: async (id) => {
            try {
                await patientService.deletePatient(id);
                const state = getStoreState();
                state.deletePatient(id);

                if (String(state.selectedPatient?.id) === String(id)) {
                    state.setTeeth({});
                }
            } catch (error) {
                console.error('[AppFacade] Failed to delete patient', error);
                throw error;
            }
        },

        /**
         * Complex business flow: mark treatment plan item as complete.
         */
        completeTreatment: async (patientId, itemId) => {
            getStoreState().completeTreatmentPlanItem(patientId, itemId);
            return AppFacade.patient.update(patientId);
        },

        /**
         * Add an item directly to history.
         */
        addToHistory: async (patientId, item) => {
            getStoreState().addToHistory(patientId, item);
            return AppFacade.patient.update(patientId);
        },

        /**
         * Add a new treatment plan item.
         */
        addTreatmentPlanItem: async (patientId, item) => {
            getStoreState().addTreatmentPlanItem(patientId, item);
            return AppFacade.patient.update(patientId);
        },

        /**
         * Get selected patient helper.
         */
        getSelected: () => getStoreState().selectedPatient,

        /**
         * Debounced chart sync to avoid request storms while preserving
         * the latest selected patient state.
         */
        syncPatient: ActionProxy.debounceSync(async (patientId) => {
            const state = getStoreState();
            const isCurrentPatient = String(state.selectedPatient?.id) === String(patientId);

            if (!isCurrentPatient) {
                return;
            }

            state.setIsSyncing(true);

            try {
                await AppFacade.patient.update(patientId);
            } catch (error) {
                console.error(`[AppFacade] Failed to sync patient ${patientId}`, error);
            } finally {
                getStoreState().setIsSyncing(false);
            }
        }, 800),
    },

    chart: {
        updateTooth: async (toothNumber, updates) => {
            const state = getStoreState();
            state.updateTooth(toothNumber, updates);

            if (state.selectedPatient?.id) {
                AppFacade.patient.syncPatient(state.selectedPatient.id);
            }
        },

        updateTeethBatch: async (updates) => {
            const state = getStoreState();
            state.updateTeeth(updates);

            if (state.selectedPatient?.id) {
                AppFacade.patient.syncPatient(state.selectedPatient.id);
            }
        },

        resetTooth: async (toothNumber) => {
            return AppFacade.chart.resetTeethBatch([toothNumber]);
        },

        resetTeethBatch: async (toothNumbers) => {
            const state = getStoreState();
            const patient = state.selectedPatient;
            if (!patient) return;

            // 1. Perform hard reset in local store (replaces objects)
            state.resetTeeth(toothNumbers);

            // Get fresh state after local reset
            const freshState = getStoreState();
            // 2. Prepare cleaned interventions and ALSO the reset chart teeth
            const cleanedPayload = {
                ...PatientModel.prepareResetPayload(patient, toothNumbers),
                chart: {
                    teeth: freshState.teeth
                }
            };
            // 3. Persist the full clean state
            return AppFacade.patient.update(patient.id, cleanedPayload);
        }
    },

    scan: {
        setOpacity: (opacity) => useAppStore.getState().setOverlayOpacity(opacity),
        setIsEditMode: (isEditMode) => useAppStore.getState().setIsEditMode(isEditMode),
        rotate: (direction) => useAppStore.getState().rotateImage(direction),
        reset: () => useAppStore.getState().resetTransform(),
        zoom: (deltaY) => useAppStore.getState().zoomImage(deltaY),

        startDragging: (x, y) => useAppStore.getState().startDragging(x, y),
        updateDragging: (x, y) => useAppStore.getState().updateDragging(x, y),
        stopDragging: () => useAppStore.getState().stopDragging(),

        startTouch: (touches) => useAppStore.getState().startTouch(touches),
        updateTouch: (touches) => useAppStore.getState().updateTouch(touches),

        setScanImage: (image) => {
            const state = useAppStore.getState();
            state.setScanImage(image);
            if (!image) {
                state.setDetections([]);
            }
        },
        deleteDetection: (id) => useAppStore.getState().deleteDetection(id),

        startProcessing: () => useAppStore.getState().startProcessing(),
        updateProgress: (progress) => useAppStore.getState().updateProgress(progress),
        stopProcessing: () => useAppStore.getState().stopProcessing(),

        loadDetections: async () => {
            try {
                const raw = await aiService.getDetections();
                const detections = AIAdapter.toDomain(raw.detections);
                useAppStore.getState().setDetections(detections);
                return detections;
            } catch (error) {
                console.error('[AppFacade] Failed to load detections via AI service', error);
            }
        },
    },
};
