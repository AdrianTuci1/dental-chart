import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getStatus = vi.fn();
const createCheckout = vi.fn();
const createPortal = vi.fn();

vi.mock('../../../../../api', () => ({
    billingService: {
        getStatus: (...args) => getStatus(...args),
        createCheckout: (...args) => createCheckout(...args),
        createPortal: (...args) => createPortal(...args),
    },
}));

const { default: BillingView } = await import('../BillingView');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const FREE_STATUS = {
    enabled: true,
    provider: 'stripe',
    plan: 'free',
    status: 'inactive',
    licensed: false,
    interval: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    prices: { month: 30, year: 300 },
    currency: 'usd',
    portalAvailable: false,
};

const LICENSED_STATUS = {
    ...FREE_STATUS,
    plan: 'pro',
    status: 'active',
    licensed: true,
    interval: 'year',
    currentPeriodEnd: '2027-10-30T00:00:00.000Z',
    portalAvailable: true,
};

const render = async (props = {}) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(<BillingView {...props} />);
    });

    return { container, root };
};

const buttonByText = (container, text) => [...container.querySelectorAll('button')]
    .find((candidate) => candidate.textContent.includes(text));

describe('BillingView', () => {
    beforeEach(() => {
        getStatus.mockReset();
        createCheckout.mockReset();
        createPortal.mockReset();
        window.history.replaceState({}, '', '/');
    });

    it('offers the monthly and yearly license on the free plan', async () => {
        getStatus.mockResolvedValue(FREE_STATUS);

        const { container, root } = await render();

        expect(container.textContent).toContain('$30');
        expect(container.textContent).toContain('$300');
        expect(container.textContent).toContain('5 patients per workspace');
        expect(buttonByText(container, 'Choose monthly').disabled).toBe(false);
        expect(buttonByText(container, 'Choose yearly').disabled).toBe(false);
        expect(buttonByText(container, 'Manage billing')).toBeUndefined();

        await act(async () => root.unmount());
    });

    it('shows the active license and the billing portal for a licensed account', async () => {
        getStatus.mockResolvedValue(LICENSED_STATUS);

        const { container, root } = await render();

        expect(container.textContent).toContain('Unlimited patients');
        expect(container.textContent).toContain('PRO license');
        expect(container.textContent).toContain('Billed yearly');
        expect(buttonByText(container, 'Manage billing').disabled).toBe(false);
        expect(buttonByText(container, 'Choose yearly')).toBeUndefined();

        await act(async () => root.unmount());
    });

    it('disables checkout when billing is not configured', async () => {
        getStatus.mockResolvedValue({
            ...FREE_STATUS,
            enabled: false,
            prices: { month: 30, year: 300 },
        });

        const { container, root } = await render();

        expect(container.textContent).toContain('Billing is not configured on this deployment.');
        expect(buttonByText(container, 'Choose monthly').disabled).toBe(true);
        expect(buttonByText(container, 'Choose yearly').disabled).toBe(true);

        await act(async () => root.unmount());
    });

    it('starts a monthly checkout when the free account chooses the plan', async () => {
        getStatus.mockResolvedValue(FREE_STATUS);
        createCheckout.mockRejectedValue(new Error('checkout unavailable'));

        const { container, root } = await render();

        await act(async () => {
            buttonByText(container, 'Choose monthly')
                .dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

        expect(createCheckout).toHaveBeenCalledWith('month');
        expect(container.textContent).toContain('checkout unavailable');

        await act(async () => root.unmount());
    });

    it('refreshes the subscription after the Stripe redirect', async () => {
        getStatus.mockResolvedValue(LICENSED_STATUS);
        const onProfileRefresh = vi.fn();
        window.history.replaceState({}, '', '/?billing=success');

        const { root } = await render({ onProfileRefresh });

        expect(getStatus).toHaveBeenCalledTimes(2);
        expect(onProfileRefresh).toHaveBeenCalledTimes(1);

        await act(async () => root.unmount());
    });
});
