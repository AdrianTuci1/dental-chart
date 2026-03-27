import apiClient from '../api/apiClient';
import { MOCK_HIERARCHY_DATA } from '../utils/mockData';

/**
 * API Service — Bridge between apiClient.js and UI Components.
 *
 * In demo mode (no backend), returns mock data directly.
 * In API mode, calls apiClient and returns backend responses as-is.
 *
 * Backend now returns data in the same camelCase shape as mockData.js,
 * so NO transformation is needed.
 */

const useMock = () => !import.meta.env.VITE_API_URL;

/**
 * Get all patients for a given medic.
 * @param {string} medicId
 * @returns {Promise<Array>} Array of patient objects in mockData shape
 */
const getPatients = async (medicId) => {
    if (useMock()) {
        const medic = MOCK_HIERARCHY_DATA.find(m => m.id === medicId);
        return medic ? medic.patients : [];
    }

    return await apiClient(`/medics/${medicId}/patients`);
};

/**
 * Get a single patient by ID, with full record (history + treatment plans).
 * Backend returns: { fullName, treatmentPlan: { items: [...] }, history: { completedItems: [...] }, ... }
 * This matches mockData.js structure exactly — no transformation needed.
 * @param {string} patientId
 * @returns {Promise<Object>} Patient object in mockData shape
 */
const getPatientById = async (patientId) => {
    if (useMock()) {
        for (const medic of MOCK_HIERARCHY_DATA) {
            const patient = medic.patients.find(p => p.id === patientId);
            if (patient) return patient;
        }
        return null;
    }

    return await apiClient(`/patients/${patientId}/chart`);
};

/**
 * Create a new patient.
 * @param {Object} patientData - { fullName, medicId, email, phone, ... }
 * @returns {Promise<Object>} Created patient
 */
const createPatient = async (patientData) => {
    return await apiClient('/patients', { method: 'POST', body: patientData });
};

export const apiService = {
    getPatients,
    getPatientById,
    createPatient,
};
