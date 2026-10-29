import { create } from 'zustand';

const useDashboardStore = create((set) => ({
    treatmentPlan: null,
    history: [],
    softTissue: null,
    oralHealthMetrics: null,
    medicalIssues: null,

    setTreatmentPlan: (plan) => set({ treatmentPlan: plan }),
    setHistory: (history) => set({ history }),
    setSoftTissue: (data) => set({ softTissue: data }),
    setOralHealthMetrics: (metrics) => set({ oralHealthMetrics: metrics }),
    setMedicalIssues: (issues) => set({ medicalIssues: issues }),
}));

export default useDashboardStore;
