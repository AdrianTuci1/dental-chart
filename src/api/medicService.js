import apiClient from './apiClient';

const getMedic = async (medicId) => apiClient(`/medics/${medicId}`);

const updateMedic = async (medicId, payload) => apiClient(`/medics/${medicId}`, {
    method: 'PUT',
    body: payload,
});

const rotateApiKey = async (medicId) => apiClient(`/medics/${medicId}/api-key/rotate`, {
    method: 'POST',
});

export const medicService = {
    getMedic,
    updateMedic,
    rotateApiKey,
};
