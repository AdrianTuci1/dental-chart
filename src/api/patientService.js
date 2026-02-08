import apiClient from './apiClient';

const getPatients = async (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient(`/patients${queryString}`);
};

const getPatient = async (id) => {
    return apiClient(`/patients/${id}`);
};

const createPatient = async (patientData) => {
    return apiClient('/patients', {
        method: 'POST',
        body: patientData,
    });
};

const updatePatient = async (id, patientData) => {
    return apiClient(`/patients/${id}`, {
        method: 'PUT',
        body: patientData,
    });
};

const deletePatient = async (id) => {
    return apiClient(`/patients/${id}`, {
        method: 'DELETE',
    });
};

export const patientService = {
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
};
