import apiClient from './apiClient';

const trackEvent = async (eventData) => apiClient('/telemetry/events', {
    method: 'POST',
    body: eventData,
});

export const telemetryService = {
    trackEvent,
};
