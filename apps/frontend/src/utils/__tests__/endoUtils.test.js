import { describe, expect, it } from 'vitest';
import { getEndoTests, hasEndoTestResult, mapEndoConditions } from '../endoUtils';

describe('endoUtils', () => {
    it('normalizes mixed-case endodontic test keys to the canonical structure', () => {
        const tests = getEndoTests({
            tests: {
                Cold: { result: 'Positive', detail: 'Within limits' },
                Heat: 'sensitive',
                Electricity: 42,
            },
        });

        expect(tests).toEqual({
            cold: { result: 'Positive', detail: 'Within limits' },
            heat: 'sensitive',
            electricity: 42,
        });
    });

    it('detects endodontic activity from normalized tests and legacy flags', () => {
        expect(hasEndoTestResult({ tests: { Cold: { result: 'Positive' } } }, 'cold')).toBe(true);
        expect(hasEndoTestResult({ electricity: true }, 'electricity')).toBe(true);
        expect(hasEndoTestResult({ tests: { electricity: 0 } }, 'electricity')).toBe(false);
    });

    it('projects an endodontic condition from stored tests even without treatment plan items', () => {
        const conditions = [];

        mapEndoConditions(
            {
                endodontic: {
                    tests: {
                        Cold: { result: 'Negative' },
                    },
                },
            },
            () => true,
            [],
            conditions
        );

        expect(conditions).toHaveLength(1);
        expect(conditions[0]).toMatchObject({
            zone: 'Endo',
            type: 'endodontic',
        });
    });
});
