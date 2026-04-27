import apiClient from './apiClient';

/**
 * Updates the user's persistent analytics profile.
 * Instead of individual events, this tracks state and milestones.
 */
const updateProfile = async (data) => apiClient('/analytics/navigation', {
    method: 'POST',
    body: data,
});

export const analyticsService = {
    updateProfile,
};
