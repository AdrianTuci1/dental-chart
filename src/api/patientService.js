import apiClient from './apiClient';

const getPatients = async (medicId) => {
    return apiClient(`/medics/${medicId}/patients`);
};

const getPatient = async (id) => {
    return apiClient(`/patients/${id}`);
};

const getPatientFull = async (id) => {
    return apiClient(`/patients/${id}/chart`);
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
    getPatientFull,
    createPatient,
    updatePatient,
    deletePatient,
};
