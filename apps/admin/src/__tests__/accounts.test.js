import { describe, expect, it } from 'vitest';
import { accountStats, filterAccounts, formatDate } from '../accounts';

const accounts = [
    { id: '1', name: 'Dr. Ana', email: 'ana@clinic.test', status: 'active' },
    { id: '2', name: 'Dr. Bogdan', email: 'bogdan@clinic.test', status: 'disabled' },
];

describe('admin account helpers', () => {
    it('counts active and disabled accounts', () => {
        expect(accountStats(accounts)).toEqual({ total: 2, active: 1, disabled: 1 });
    });

    it('filters by search and status', () => {
        expect(filterAccounts(accounts, { search: 'ana' })).toHaveLength(1);
        expect(filterAccounts(accounts, { search: 'clinic.test' })).toHaveLength(2);
        expect(filterAccounts(accounts, { status: 'disabled' })).toEqual([accounts[1]]);
        expect(filterAccounts(accounts, { search: 'missing' })).toEqual([]);
    });

    it('formats a date and tolerates missing values', () => {
        expect(formatDate('2026-10-29T10:00:00.000Z')).toContain('2026');
        expect(formatDate(null)).toBe('—');
    });
});
