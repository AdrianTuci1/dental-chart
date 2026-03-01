import { create } from 'zustand';
import { createPatientSlice } from './slices/patientSlice';
import { createChartSlice } from './slices/chartSlice';

/**
 * Root Application Store combining all domain slices.
 * It's the Single Source of Truth for the UI.
 * 
 * Zustand allows cross-slice communication naturally by passing
 * the `get` method to slices.
 */
export const useAppStore = create((set, get) => ({
    ...createPatientSlice(set, get),
    ...createChartSlice(set, get),
}));
