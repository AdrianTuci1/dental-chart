import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '../apiService';

// Mock apiClient
vi.mock('../../api/apiClient', () => ({
    default: vi.fn(),
}));

import apiClient from '../../api/apiClient';
import { MOCK_HIERARCHY_DATA } from '../../utils/mockData';

/**
 * Expected data shapes — extracted from mockData.js.
 * These are the shapes that components like PatientsListPage and PatientLayout expect.
 */
const EXPECTED_PATIENT_KEYS = [
    'id', 'fullName', 'dateOfBirth', 'gender', 'phone', 'email',
    'treatmentPlan', 'history',
];

const EXPECTED_TREATMENT_PLAN_ITEM_KEYS = ['id', 'tooth', 'type', 'procedure', 'status'];
const EXPECTED_HISTORY_ITEM_KEYS = ['id', 'tooth', 'type', 'status', 'procedure'];

describe('apiService — Data Shape Conformity Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ──────────────── Mock Mode Tests ────────────────

    describe('Mock Mode — returns data matching mockData.js directly', () => {
        beforeEach(() => {
            delete import.meta.env.VITE_API_URL;
        });

        it('getPatients returns patients with correct shape', async () => {
            const patients = await apiService.getPatients('medic-1');

            expect(Array.isArray(patients)).toBe(true);
            expect(patients.length).toBeGreaterThan(0);

            const patient = patients[0];
            expect(patient).toHaveProperty('id');
            expect(patient).toHaveProperty('fullName');
            expect(patient).toHaveProperty('dateOfBirth');
            expect(patient).toHaveProperty('email');
            expect(patient).toHaveProperty('phone');
            expect(typeof patient.fullName).toBe('string');
        });

        it('getPatientById returns patient with nested treatmentPlan and history', async () => {
            const patient = await apiService.getPatientById('patient-1');

            expect(patient).not.toBeNull();
            expect(patient.fullName).toBe('John Doe');

            // treatmentPlan.items[]
            expect(patient.treatmentPlan).toBeDefined();
            expect(Array.isArray(patient.treatmentPlan.items)).toBe(true);
            expect(patient.treatmentPlan.items.length).toBeGreaterThan(0);

            const planItem = patient.treatmentPlan.items[0];
            EXPECTED_TREATMENT_PLAN_ITEM_KEYS.forEach(key => {
                expect(planItem).toHaveProperty(key);
            });

            // history.completedItems[]
            expect(patient.history).toBeDefined();
            expect(Array.isArray(patient.history.completedItems)).toBe(true);
            expect(patient.history.completedItems.length).toBeGreaterThan(0);

            const historyItem = patient.history.completedItems[0];
            EXPECTED_HISTORY_ITEM_KEYS.forEach(key => {
                expect(historyItem).toHaveProperty(key);
            });
        });

        it('getPatientById returns patient with oralHealth, bpe, medicalIssues', async () => {
            const patient = await apiService.getPatientById('patient-1');

            expect(patient.oralHealth).toHaveProperty('plaqueIndex');
            expect(patient.oralHealth).toHaveProperty('bleedingIndex');
            expect(patient.bpe).toHaveProperty('upperRight');
            expect(patient.bpe).toHaveProperty('lowerLeft');
            expect(patient.medicalIssues).toHaveProperty('allergies');
        });

        it('getPatients returns empty for unknown medic', async () => {
            expect(await apiService.getPatients('unknown')).toEqual([]);
        });

        it('getPatientById returns null for unknown patient', async () => {
            expect(await apiService.getPatientById('unknown')).toBeNull();
        });
    });

    // ──────────────── API Mode Tests ────────────────

    describe('API Mode — apiClient is called and data passes through', () => {
        /**
         * Mock backend response — identical shape to mockData.js.
         * Since we updated the backend to return camelCase nested data,
         * the apiService should pass it through without transformation.
         */
        const MOCK_BACKEND_RESPONSE = {
            id: 'patient-1',
            fullName: 'John Doe',
            dateOfBirth: '1980-05-15',
            gender: 'male',
            phone: '555-0123',
            email: 'john.doe@example.com',
            lastExamDate: '2024-10-01',
            medicalIssues: { allergies: ['Penicillin'] },
            oralHealth: { plaqueIndex: 15, bleedingIndex: 8 },
            bpe: { upperRight: 1, lowerLeft: 1 },
            treatmentPlan: {
                items: [
                    { id: 'tp1', tooth: 11, type: 'decay', procedure: 'Decay Treatment', status: 'planned' },
                ]
            },
            history: {
                completedItems: [
                    { id: 'h-1', tooth: 11, type: 'restoration', procedure: 'Filling', status: 'completed' },
                ]
            },
        };

        beforeEach(() => {
            import.meta.env.VITE_API_URL = 'http://localhost:3000';
        });

        it('getPatientById calls apiClient and returns data as-is', async () => {
            apiClient.mockResolvedValueOnce(MOCK_BACKEND_RESPONSE);

            const patient = await apiService.getPatientById('patient-1');

            expect(apiClient).toHaveBeenCalledWith('/patients/patient-1/chart');
            expect(patient.fullName).toBe('John Doe');
            expect(patient.treatmentPlan.items.length).toBe(1);
            expect(patient.history.completedItems.length).toBe(1);
        });

        it('getPatients calls apiClient and returns array', async () => {
            apiClient.mockResolvedValueOnce([MOCK_BACKEND_RESPONSE]);

            const patients = await apiService.getPatients('medic-1');

            expect(apiClient).toHaveBeenCalledWith('/medics/medic-1/patients');
            expect(patients.length).toBe(1);
            expect(patients[0].fullName).toBe('John Doe');
        });

        it('createPatient calls apiClient with POST', async () => {
            apiClient.mockResolvedValueOnce({ id: 'new-1', fullName: 'Jane Doe' });

            const result = await apiService.createPatient({ fullName: 'Jane Doe', medicId: 'm-1' });

            expect(apiClient).toHaveBeenCalledWith('/patients', {
                method: 'POST',
                body: { fullName: 'Jane Doe', medicId: 'm-1' },
            });
            expect(result.fullName).toBe('Jane Doe');
        });
    });

    // ──────────────── Shape Parity ────────────────

    describe('Shape Parity — backend response matches mockData.js structure', () => {
        it('mock patient has same shape that backend should produce', () => {
            const mockPatient = MOCK_HIERARCHY_DATA[0].patients[0];

            // All expected keys present
            EXPECTED_PATIENT_KEYS.forEach(key => {
                expect(mockPatient).toHaveProperty(key);
            });

            // Nested structures
            expect(mockPatient.treatmentPlan).toHaveProperty('items');
            expect(mockPatient.history).toHaveProperty('completedItems');
            expect(Array.isArray(mockPatient.treatmentPlan.items)).toBe(true);
            expect(Array.isArray(mockPatient.history.completedItems)).toBe(true);
        });
    });
});
