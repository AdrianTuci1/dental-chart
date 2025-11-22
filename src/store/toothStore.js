import { create } from 'zustand';

// This store might be redundant if chartStore holds all data, 
// but can be useful for temporary state while editing a specific tooth
const useToothStore = create((set) => ({
    currentTooth: null,

    setCurrentTooth: (tooth) => set({ currentTooth: tooth }),
    updateCurrentTooth: (updates) => set((state) => ({
        currentTooth: { ...state.currentTooth, ...updates }
    })),
    reset: () => set({ currentTooth: null }),
}));

export default useToothStore;
