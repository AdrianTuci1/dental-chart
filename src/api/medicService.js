import apiClient from './apiClient';

const getMedic = async (medicId) => apiClient(`/medics/${medicId}`);

const rotateApiKey = async (medicId) => apiClient(`/medics/${medicId}/api-key/rotate`, {
    method: 'POST',
});

export const medicService = {
    getMedic,
    rotateApiKey,
};
