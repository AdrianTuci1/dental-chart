import { resolveActiveClinicId } from '../../workspaces/workspaceHelpers';

const ACTIVE_CLINIC_STORAGE_KEY = 'dchart.activeClinicId';

export const readStoredActiveClinicId = () => {
    try {
        return localStorage.getItem(ACTIVE_CLINIC_STORAGE_KEY);
    } catch {
        return null;
    }
};

export const clearStoredActiveClinicId = () => {
    try {
        localStorage.removeItem(ACTIVE_CLINIC_STORAGE_KEY);
    } catch {
        // Storage is unavailable (private mode); the in-memory value still works.
    }
};

const writeStoredActiveClinicId = (clinicId) => {
    try {
        if (clinicId) {
            localStorage.setItem(ACTIVE_CLINIC_STORAGE_KEY, clinicId);
        } else {
            localStorage.removeItem(ACTIVE_CLINIC_STORAGE_KEY);
        }
    } catch {
        // Storage is unavailable (private mode); the in-memory value still works.
    }
};

/**
 * Zustand Slice for the workspace the medic is currently working in.
 */
export const createWorkspaceSlice = (set, get) => ({
    activeClinicId: readStoredActiveClinicId(),

    setActiveClinicId: (clinicId) => {
        writeStoredActiveClinicId(clinicId || null);
        set({ activeClinicId: clinicId || null });
    },

    /**
     * Aligns the stored selection with the workspaces the account can access.
     * Returns the id in use, or null when the account has no workspace yet.
     */
    syncActiveClinicWithProfile: (profile) => {
        const resolved = resolveActiveClinicId(profile, get().activeClinicId);

        if (resolved !== get().activeClinicId) {
            get().setActiveClinicId(resolved);
        }

        return resolved;
    },
});
