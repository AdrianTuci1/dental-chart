import { produce } from 'immer';

/**
 * Zustand Slice for Medic (User) domain.
 * 
 * @param {Function} set - Zustand setter
 * @param {Function} get - Zustand getter
 */
export const createMedicSlice = (set) => ({
    medicProfile: null,

    setMedicProfile: (profile) => set({ medicProfile: profile }),

    updateMedicProfile: (updatedProfile) => set(produce((state) => {
        state.medicProfile = { ...state.medicProfile, ...updatedProfile };
    })),
});
