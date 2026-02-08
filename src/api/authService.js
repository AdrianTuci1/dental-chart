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

export const authService = {
    login,
    register,
    logout,
    getCurrentUser,
};
