import { MOCK_HIERARCHY_DATA } from '../utils/mockData';

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulated API Service
 * Replaces direct imports of static mock data to mimic asynchronous DB fetching (e.g. DynamoDB).
 */
export const apiService = {

    /**
     * Fetch all patients for a given medic.
     * In a real app, this would query a Patients table by medicId.
     * Returns a summary list of patients (excluding full chart data to save bandwidth).
     */
    async getPatients(medicId = 'medic-1') {
        await delay(600); // simulate latency

        const medic = MOCK_HIERARCHY_DATA.find(m => m.id === medicId);
        if (!medic) return [];

        // Return patients without the heavy chart data
        return medic.patients.map(p => {
            const { chart, ...patientData } = p;
            return {
                ...patientData,
                // Include basic chart metadata if needed (e.g., lastUpdated)
                chartMeta: chart ? { id: chart.id, lastUpdated: chart.lastUpdated } : null
            };
        });
    },

    /**
     * Fetch detailed data for a specific patient.
     */
    async getPatientById(patientId) {
        await delay(400);

        for (const medic of MOCK_HIERARCHY_DATA) {
            const patient = medic.patients.find(p => p.id === patientId);
            if (patient) {
                // Return patient, but strip out the heavy chart for now (to be fetched separately or together)
                // Depending on DynamoDB design, they might be in the same item or separate. 
                // We'll return everything here for simplicity of the Patient Model, 
                // but emphasize chart separation.
                const { chart, ...patientData } = patient;
                return patientData;
            }
        }
        return null;
    }
};
