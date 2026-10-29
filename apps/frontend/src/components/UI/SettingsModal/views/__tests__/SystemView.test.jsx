import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getConfig = vi.fn();
const sendTestEmail = vi.fn();

vi.mock('../../../../../api', () => ({
    systemService: {
        getConfig: (...args) => getConfig(...args),
        sendTestEmail: (...args) => sendTestEmail(...args),
    },
}));

const { default: SystemView } = await import('../SystemView');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const CONFIG = {
    runtime: { environment: 'test', corsOrigins: [] },
    database: {
        driver: 'dynamo',
        tableName: 'DentalChart',
        region: 'eu-central-1',
        target: { configured: true, table: 'DentalChart' },
    },
    email: {
        configured: false,
        provider: 'none',
        requestedProvider: 'resend',
        from: null,
        reason: 'missing_credentials',
        detail: 'EMAIL_PROVIDER="resend" needs RESEND_API_KEY',
    },
    google: { configured: false },
    ai: { enabled: false, inferenceConfigured: false },
    auth: {
        jwtSecretConfigured: true,
        refreshTokenSecretConfigured: true,
        accessTokenLifetime: '15m',
        refreshTokenLifetime: '365d',
    },
    warnings: ['EMAIL_PROVIDER="resend" needs RESEND_API_KEY'],
};

const render = async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(<SystemView />);
    });

    return { container, root };
};

describe('SystemView', () => {
    beforeEach(() => {
        getConfig.mockReset();
        sendTestEmail.mockReset();
    });

    it('shows the active driver and the inactive email provider', async () => {
        getConfig.mockResolvedValue(CONFIG);

        const { container, root } = await render();

        expect(container.textContent).toContain('DynamoDB');
        expect(container.textContent).toContain('DentalChart');
        expect(container.textContent).toContain('inactive');
        expect(container.textContent).toContain('RESEND_API_KEY');

        await act(async () => root.unmount());
    });

    it('reports the result of a test email without hiding the configuration state', async () => {
        getConfig.mockResolvedValue(CONFIG);
        sendTestEmail.mockResolvedValue({
            to: 'doctor@clinic.test',
            delivered: false,
            provider: 'none',
            reason: 'not_configured',
            detail: 'no email provider configured',
        });

        const { container, root } = await render();
        const button = [...container.querySelectorAll('button')]
            .find((candidate) => candidate.textContent.includes('Send test email'));

        expect(button).toBeTruthy();

        await act(async () => {
            button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

        expect(sendTestEmail).toHaveBeenCalledTimes(1);
        expect(container.textContent).toContain('Not delivered (not_configured)');
        expect(container.textContent).toContain('DynamoDB');

        await act(async () => root.unmount());
    });
});
