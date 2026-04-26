import apiClient from './apiClient';

const trackEvent = async (eventData) => {
    return apiClient('/telemetry/events', {
        method: 'POST',
        body: eventData,
    });
};

const getEvents = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/telemetry/events${query ? `?${query}` : ''}`);
};

export const telemetryService = {
    trackEvent,
    getEvents,
};
