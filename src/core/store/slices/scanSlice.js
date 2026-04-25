import { produce } from 'immer';
import { ScanModel } from '../../models/ScanModel';
import { MOCK_DETECTIONS } from '../../../utils/mockData';

export const createScanSlice = (set, get) => ({
    scanImage: '/chart2.png',
    detections: MOCK_DETECTIONS,
    isProcessing: false,
    progress: 0,
    overlayOpacity: 95,
    isEditMode: false,
    isDragging: false,
    imageTransform: ScanModel.INITIAL_TRANSFORM,
    dragState: { startX: 0, startY: 0, initialX: 0, initialY: 0 },
    touchState: { lastDist: 0 },

    setScanImage: (image) => set({ scanImage: image }),
    setDetections: (detections) => set({ detections }),
    setOverlayOpacity: (opacity) => set({ overlayOpacity: opacity }),
    setIsEditMode: (isEditMode) => set({ isEditMode }),

    // Manipulation Actions
    startDragging: (clientX, clientY) => set((state) => ({
        isDragging: true,
        dragState: {
            startX: clientX,
            startY: clientY,
            initialX: state.imageTransform.x,
            initialY: state.imageTransform.y
        }
    })),

    updateDragging: (clientX, clientY) => set(produce((state) => {
        if (!state.isDragging) return;
        const transform = ScanModel.calculatePan(state.dragState, clientX, clientY);
        state.imageTransform.x = transform.x;
        state.imageTransform.y = transform.y;
    })),

    stopDragging: () => set({ isDragging: false }),

    zoomImage: (deltaY) => set(produce((state) => {
        state.imageTransform.scale = ScanModel.calculateZoom(state.imageTransform.scale, deltaY);
    })),

    rotateImage: (direction) => set(produce((state) => {
        state.imageTransform.rotate = ScanModel.calculateRotate(state.imageTransform.rotate, direction);
    })),

    resetTransform: () => set({ imageTransform: ScanModel.INITIAL_TRANSFORM }),

    // Touch Actions
    startTouch: (touches) => set(produce((state) => {
        if (touches.length === 1) {
            state.isDragging = true;
            state.dragState = {
                startX: touches[0].clientX,
                startY: touches[0].clientY,
                initialX: state.imageTransform.x,
                initialY: state.imageTransform.y
            };
        } else if (touches.length === 2) {
            state.touchState.lastDist = ScanModel.getTouchDistance(touches);
        }
    })),

    updateTouch: (touches) => set(produce((state) => {
        if (touches.length === 1 && state.isDragging) {
            const transform = ScanModel.calculatePan(state.dragState, touches[0].clientX, touches[0].clientY);
            state.imageTransform.x = transform.x;
            state.imageTransform.y = transform.y;
        } else if (touches.length === 2) {
            const dist = ScanModel.getTouchDistance(touches);
            if (state.touchState.lastDist > 0) {
                const ratio = dist / state.touchState.lastDist;
                state.imageTransform.scale = Math.min(Math.max(state.imageTransform.scale * ratio, 0.1), 5);
            }
            state.touchState.lastDist = dist;
        }
    })),

    // Processing Actions
    startProcessing: () => set({ isProcessing: true, progress: 0 }),
    updateProgress: (progress) => set({ progress }),
    stopProcessing: () => set({ isProcessing: false, progress: 0 }),

    deleteDetection: (id) => set(produce((state) => {
        state.detections = state.detections.filter(d => d.id !== id);
    })),
});
