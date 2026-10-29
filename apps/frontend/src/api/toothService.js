import apiClient from './apiClient';

/**
 * Service for handling tooth-specific operations.
 * Often tooth data is embedded in the chart, but specific operations
 * like updating a single tooth's status or notes might be handled separately.
 */

const getToothHistory = async (patientId, toothId) => {
    return apiClient(`/patients/${patientId}/teeth/${toothId}/history`);
};

const updateTooth = async (patientId, toothId, toothData) => {
    return apiClient(`/patients/${patientId}/teeth/${toothId}`, {
        method: 'PUT',
        body: toothData,
    });
};

const getToothNotes = async (patientId, toothId) => {
    return apiClient(`/patients/${patientId}/teeth/${toothId}/notes`);
};

const saveToothNote = async (patientId, toothId, note) => {
    return apiClient(`/patients/${patientId}/teeth/${toothId}/notes`, {
        method: 'POST',
        body: { note },
    });
};

export const toothService = {
    getToothHistory,
    updateTooth,
    getToothNotes,
    saveToothNote,
};
