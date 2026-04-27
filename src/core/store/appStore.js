import { create } from 'zustand';
import { createPatientSlice } from './slices/patientSlice';
import { createChartSlice } from './slices/chartSlice';
import { createMedicSlice } from './slices/medicSlice';
import { createScanSlice } from './slices/scanSlice';
import { MOCK_DETECTIONS } from '../../utils/mockData';
import { ScanModel } from '../models/ScanModel';

const createSessionResetState = () => ({
    patients: [],
    selectedPatient: null,
    searchQuery: '',
    isSyncing: false,
    medicProfile: null,
    teeth: {},
    resolvedTeeth: {},
    previewTeeth: {},
    selectedTooth: null,
    chartView: 'normal',
    viewMode: 'overview',
    historicalDate: null,
    showEndo: true,
    showPerio: true,
    showDental: true,
    scanImage: '/chart2.png',
    detections: [...MOCK_DETECTIONS],
    isProcessing: false,
    progress: 0,
    overlayOpacity: 95,
    isEditMode: false,
    isDragging: false,
    imageTransform: { ...ScanModel.INITIAL_TRANSFORM },
    dragState: { startX: 0, startY: 0, initialX: 0, initialY: 0 },
    touchState: { lastDist: 0 },
});

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
    ...createMedicSlice(set, get),
    ...createScanSlice(set, get),
    resetSession: () => set(createSessionResetState()),
}));
