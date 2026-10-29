import apiClient from './apiClient';

const billingService = {
    getStatus: () => apiClient('/billing/status'),
    createCheckout: (interval) => apiClient('/billing/checkout', {
        method: 'POST',
        body: { interval },
    }),
    createPortal: () => apiClient('/billing/portal', { method: 'POST' }),
};

export default billingService;
