jest.mock('uuid', () => ({ v4: () => 'mock-uuid-1234' }));

const mockMedicService = {
    createMedic: jest.fn(),
    getMedicByEmail: jest.fn(),
    getMedicProfile: jest.fn(),
    toPublicMedic: jest.fn((medic) => {
        const { passwordHash, ...publicMedic } = medic;
        return publicMedic;
    }),
};

jest.mock('../src/services/MedicService', () => {
    return jest.fn().mockImplementation(() => mockMedicService);
});

const mockTelemetryService = {
    trackEvent: jest.fn().mockResolvedValue({}),
};

jest.mock('../src/services/TelemetryService', () => {
    return jest.fn().mockImplementation(() => mockTelemetryService);
});

const bcrypt = require('bcryptjs');
const { signAuthToken } = require('../src/utils/auth');
const authController = require('../src/controllers/authController');

const createRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('authController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('register hashes the password and returns a JWT', async () => {
        mockMedicService.createMedic.mockResolvedValue({
            id: 'm-1',
            name: 'Dr. Smith',
            email: 'dr@smith.com',
            subscriptionPlan: 'free',
            passwordHash: 'hashed',
        });

        const req = {
            body: {
                name: 'Dr. Smith',
                email: 'dr@smith.com',
                password: 'supersecret',
            },
        };
        const res = createRes();

        await authController.register(req, res);

        expect(mockMedicService.createMedic).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Dr. Smith',
                email: 'dr@smith.com',
                passwordHash: expect.any(String),
            })
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'm-1',
                email: 'dr@smith.com',
                token: expect.any(String),
            })
        );
    });

    it('login rejects invalid passwords', async () => {
        const passwordHash = await bcrypt.hash('right-password', 4);
        mockMedicService.getMedicByEmail.mockResolvedValue({
            id: 'm-1',
            name: 'Dr. Smith',
            email: 'dr@smith.com',
            subscriptionPlan: 'free',
            passwordHash,
        });

        const req = {
            body: {
                email: 'dr@smith.com',
                password: 'wrong-password',
            },
        };
        const res = createRes();

        await authController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('getMe resolves the medic from a valid JWT', async () => {
        mockMedicService.getMedicProfile.mockResolvedValue({
            id: 'm-1',
            name: 'Dr. Smith',
            email: 'dr@smith.com',
        });

        const token = signAuthToken({ id: 'm-1', email: 'dr@smith.com' });
        const req = {
            headers: {
                authorization: `Bearer ${token}`,
            },
        };
        const res = createRes();

        await authController.getMe(req, res);

        expect(mockMedicService.getMedicProfile).toHaveBeenCalledWith('m-1');
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'm-1',
                email: 'dr@smith.com',
            })
        );
    });
});
