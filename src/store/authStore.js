import { create } from 'zustand';

const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    demoMode: true,

    login: (user) => set({ user, isAuthenticated: true }),
    logout: () => set({ user: null, isAuthenticated: false }),
    setDemoMode: (isDemo) => set({ demoMode: isDemo }),
}));

export default useAuthStore;
