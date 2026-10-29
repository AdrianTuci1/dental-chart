import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { adminApi } from '../api';

vi.mock('../api', () => ({
    adminApi: {
        login: vi.fn(),
        refresh: vi.fn(),
        listAccounts: vi.fn(),
        setStatus: vi.fn(),
        deleteAccount: vi.fn(),
    },
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Node exposes an experimental localStorage that stays undefined without a backing file,
// which shadows the jsdom one. The admin app only needs get/set/remove, so a small
// in-memory implementation keeps the component test focused on behavior.
const values = new Map();
Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
        getItem: (key) => (values.has(key) ? values.get(key) : null),
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key),
        clear: () => values.clear(),
    },
});

const setInputValue = (input, value) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('admin App', () => {
    let container;
    let root;

    beforeEach(() => {
        window.localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.clearAllMocks();
    });

    it('signs in and shows the account list', async () => {
        adminApi.login.mockResolvedValue({
            token: 'access-token',
            refreshToken: 'refresh-token',
            email: 'root@clinic.test',
            name: 'Root Admin',
        });
        adminApi.listAccounts.mockResolvedValue([
            { id: '1', name: 'Dr. Ana', email: 'ana@clinic.test', status: 'active' },
            { id: '2', name: 'Dr. Bogdan', email: 'bogdan@clinic.test', status: 'disabled' },
        ]);

        await act(async () => root.render(<App />));

        expect(container.textContent).toContain('Sign in to manage accounts');

        await act(async () => {
            setInputValue(container.querySelector('#admin-email'), 'root@clinic.test');
            setInputValue(container.querySelector('#admin-password'), 'secret');
        });

        await act(async () => {
            container.querySelector('form').dispatchEvent(
                new Event('submit', { bubbles: true, cancelable: true })
            );
        });

        expect(adminApi.login).toHaveBeenCalledWith('root@clinic.test', 'secret');
        expect(adminApi.listAccounts).toHaveBeenCalledWith('access-token');
        expect(container.textContent).toContain('ana@clinic.test');
        expect(container.textContent).toContain('bogdan@clinic.test');
        expect(container.textContent).toContain('Disabled');
    });

    it('disables an account and refreshes the row', async () => {
        window.localStorage.setItem('pixtooth.admin.session', JSON.stringify({
            token: 'access-token',
            refreshToken: 'refresh-token',
            email: 'root@clinic.test',
        }));

        adminApi.listAccounts.mockResolvedValue([
            { id: '1', name: 'Dr. Ana', email: 'ana@clinic.test', status: 'active' },
        ]);
        adminApi.setStatus.mockResolvedValue({
            id: '1', name: 'Dr. Ana', email: 'ana@clinic.test', status: 'disabled',
        });

        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

        await act(async () => root.render(<App />));

        const disableButton = [...container.querySelectorAll('button')]
            .find((button) => button.textContent === 'Disable');

        await act(async () => {
            disableButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

        expect(adminApi.setStatus).toHaveBeenCalledWith('access-token', '1', 'disabled');
        expect(container.textContent).toContain('ana@clinic.test is now disabled.');
        expect(container.textContent).toContain('Enable');

        confirm.mockRestore();
    });
});
