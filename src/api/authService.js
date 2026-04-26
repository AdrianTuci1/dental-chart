import apiClient from './apiClient';

const login = async (credentials) => {
    return apiClient('/auth/login', {
        method: 'POST',
        body: credentials,
    });
};

const register = async (userData) => {
    return apiClient('/auth/register', {
        method: 'POST',
        body: userData,
    });
};

const logout = () => {
    localStorage.removeItem('token');
    // Optional: Call backend to invalidate token if needed
};

const getCurrentUser = async () => {
    return apiClient('/auth/me');
};

const forgotPassword = async (payload) => {
    return apiClient('/auth/forgot-password', {
        method: 'POST',
        body: payload,
    });
};

const resetPassword = async (payload) => {
    return apiClient('/auth/reset-password', {
        method: 'POST',
        body: payload,
    });
};

const changePassword = async (payload) => {
    return apiClient('/auth/change-password', {
        method: 'POST',
        body: payload,
    });
};

export const authService = {
    login,
    register,
    logout,
    getCurrentUser,
    forgotPassword,
    resetPassword,
    changePassword,
};
