import { describe, expect, it } from 'vitest';
import {
    describeAge,
    describeTimeSince,
    formatIsoDate,
    getAgeFromBirthDate,
    getPlanSummary,
    getSortValue,
    hasExamRecord,
    parseIsoDate,
} from '../patientDisplay';

// A fixed reference date keeps the age and "how long ago" assertions stable.
const REFERENCE = new Date(2026, 7, 31); // 31 Aug 2026, local time

describe('patientDisplay dates', () => {
    it('parses an ISO date as local midnight so the day never shifts', () => {
        const date = parseIsoDate('1980-05-15');

        expect(date.getFullYear()).toBe(1980);
        expect(date.getMonth()).toBe(4);
        expect(date.getDate()).toBe(15);
    });

    it('formats dates for reading instead of printing the stored value', () => {
        expect(formatIsoDate('2024-10-01')).toBe('1 Oct 2024');
        expect(formatIsoDate('2024-10-01T15:30:00.000Z')).toBe('1 Oct 2024');
    });

    it('returns null instead of a fake date for junk values', () => {
        expect(formatIsoDate('N/A')).toBeNull();
        expect(formatIsoDate('')).toBeNull();
        expect(formatIsoDate(undefined)).toBeNull();
        expect(formatIsoDate('yesterday')).toBeNull();
    });

    it('counts whole years of age', () => {
        expect(getAgeFromBirthDate('1980-05-15', REFERENCE)).toBe(46);
        // Birthday has not happened yet in the reference year.
        expect(getAgeFromBirthDate('1980-09-15', REFERENCE)).toBe(45);
        expect(getAgeFromBirthDate('', REFERENCE)).toBeNull();
        expect(getAgeFromBirthDate('2030-01-01', REFERENCE)).toBeNull();
    });

    it('describes young children in months', () => {
        expect(describeAge('2025-11-10', REFERENCE)).toBe('9 months');
        expect(describeAge('2024-05-15', REFERENCE)).toBe('2 yr');
        expect(describeAge('1980-05-15', REFERENCE)).toBe('46 yr');
    });

    it('describes how stale an exam is', () => {
        expect(describeTimeSince('2026-08-31', REFERENCE)).toBe('today');
        expect(describeTimeSince('2026-08-30', REFERENCE)).toBe('yesterday');
        expect(describeTimeSince('2026-08-01', REFERENCE)).toBe('30 days ago');
        expect(describeTimeSince('2026-05-01', REFERENCE)).toBe('4 months ago');
        // Beyond a year the label rounds to the nearest year rather than listing months.
        expect(describeTimeSince('2025-07-01', REFERENCE)).toBe('last year');
        expect(describeTimeSince('2024-10-01', REFERENCE)).toBe('2 years ago');
        expect(describeTimeSince('2019-03-01', REFERENCE)).toBe('8 years ago');
        expect(describeTimeSince('2026-09-15', REFERENCE)).toBe('scheduled');
    });
});

describe('patientDisplay exam records', () => {
    it('treats the placeholder written at creation time as no exam', () => {
        expect(hasExamRecord('N/A')).toBe(false);
        expect(hasExamRecord('n/a')).toBe(false);
        expect(hasExamRecord('no value')).toBe(false);
        expect(hasExamRecord(null)).toBe(false);
        expect(hasExamRecord('2024-10-01')).toBe(true);
    });
});

describe('patientDisplay treatment plan', () => {
    it('counts planned and monitoring items from either payload shape', () => {
        const wrapped = {
            treatmentPlan: {
                items: [
                    { status: 'planned' },
                    { status: 'planned' },
                    { status: 'monitoring' },
                    { status: 'completed' },
                ],
            },
        };
        const flat = { treatmentPlan: [{ status: 'planned' }] };

        expect(getPlanSummary(wrapped)).toEqual({ planned: 2, monitoring: 1, open: 3 });
        expect(getPlanSummary(flat)).toEqual({ planned: 1, monitoring: 0, open: 1 });
        expect(getPlanSummary({})).toEqual({ planned: 0, monitoring: 0, open: 0 });
    });
});

describe('patientDisplay sorting', () => {
    it('sorts names case-insensitively', () => {
        expect(getSortValue({ name: 'Ána' }, 'name')).toBe('ána');
        expect(getSortValue({}, 'name')).toBe('');
    });

    it('pushes patients without an exam to one end instead of scattering them', () => {
        const missing = getSortValue({ lastExamDate: 'N/A' }, 'lastExam');
        const known = getSortValue({ lastExamDate: '2024-10-01' }, 'lastExam');

        expect(missing).toBe(-Infinity);
        expect(known).toBeGreaterThan(missing);
    });

    it('sorts by the number of open plan items', () => {
        expect(getSortValue({ treatmentPlan: { items: [{ status: 'planned' }] } }, 'plan')).toBe(1);
    });
});
