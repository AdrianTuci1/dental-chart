import apiClient from './apiClient';

const getChart = async (patientId) => {
    return apiClient(`/patients/${patientId}/chart`);
};

const saveChart = async (patientId, chartData) => {
    return apiClient(`/patients/${patientId}/chart`, {
        method: 'POST',
        body: chartData,
    });
};

const updateChart = async (patientId, chartData) => {
    return apiClient(`/patients/${patientId}/chart`, {
        method: 'PUT',
        body: chartData,
    });
};

export const chartService = {
    getChart,
    saveChart,
    updateChart,
};
