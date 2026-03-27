import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService, patientService } from '../index';
import apiClient from '../apiClient';
import { MOCK_HIERARCHY_DATA } from '../../utils/mockData';

// Mock apiClient
vi.mock('../apiClient', () => ({
    default: vi.fn(),
}));

describe('Frontend API Services', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset env
        import.meta.env.VITE_API_URL = undefined;
    });

    describe('authService', () => {
        it('getCurrentUser calls /auth/me', async () => {
            apiClient.mockResolvedValueOnce({ id: 'm-1', name: 'Dr. Smith' });
            const user = await authService.getCurrentUser();
            expect(apiClient).toHaveBeenCalledWith('/auth/me');
            expect(user.name).toBe('Dr. Smith');
        });
    });

    describe('patientService', () => {
        it('getPatients calls /medics/:id/patients', async () => {
            apiClient.mockResolvedValueOnce([]);
            await patientService.getPatients('medic-1');
            expect(apiClient).toHaveBeenCalledWith('/medics/medic-1/patients');
        });

        it('getPatientFull calls /patients/:id/chart', async () => {
            apiClient.mockResolvedValueOnce({ id: 'p-1', fullName: 'John Doe' });
            await patientService.getPatientFull('p-1');
            expect(apiClient).toHaveBeenCalledWith('/patients/p-1/chart');
        });

        it('createPatient calls POST /patients', async () => {
            const patientData = { fullName: 'Jane Doe', medicId: 'm-1' };
            apiClient.mockResolvedValueOnce({ id: 'new-1', ...patientData });
            await patientService.createPatient(patientData);
            expect(apiClient).toHaveBeenCalledWith('/patients', {
                method: 'POST',
                body: patientData,
            });
        });
    });
});
