import apiClient from './apiClient';

const getPendingInvitations = async () => apiClient('/clinics/invitations/pending');

const updateClinic = async (clinicId, payload) => apiClient(`/clinics/${clinicId}`, {
    method: 'PUT',
    body: payload,
});

const inviteMedic = async (clinicId, payload) => apiClient(`/clinics/${clinicId}/invitations`, {
    method: 'POST',
    body: payload,
});

const acceptInvitation = async (clinicId, inviteId) => apiClient(`/clinics/${clinicId}/invitations/${inviteId}/accept`, {
    method: 'POST',
    body: {},
});

const removeMember = async (clinicId, medicId) => apiClient(`/clinics/${clinicId}/members/${medicId}`, {
    method: 'DELETE',
});

const transferOwnership = async (clinicId, newOwnerMedicId) => apiClient(`/clinics/${clinicId}/ownership-transfer`, {
    method: 'POST',
    body: { newOwnerMedicId },
});

const deleteClinic = async (clinicId) => apiClient(`/clinics/${clinicId}`, {
    method: 'DELETE',
});

export const clinicService = {
    getPendingInvitations,
    updateClinic,
    inviteMedic,
    acceptInvitation,
    removeMember,
    transferOwnership,
    deleteClinic,
};
