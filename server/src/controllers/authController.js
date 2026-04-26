const MedicService = require('../services/MedicService');
const TelemetryService = require('../services/TelemetryService');
const bcrypt = require('bcryptjs');
const { signAuthToken, verifyAuthToken, extractMedicIdFromAuthHeader } = require('../utils/auth');
const medicService = new MedicService();
const telemetryService = new TelemetryService();

/**
 * Auth Controller
 * Handles registration (medic account creation) and login.
 * For now uses simple token placeholder — real JWT integration later.
 */

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'name, email and password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'password must be at least 8 characters long' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Create the medic account
        const newMedic = await medicService.createMedic({ name, email, passwordHash });

        const token = signAuthToken(newMedic);
        const publicMedic = medicService.toPublicMedic(newMedic);

        await telemetryService.trackEvent({
            eventName: 'user_registered',
            category: 'auth',
            userId: publicMedic.id,
            clinicId: publicMedic.defaultClinicId || null,
            entityType: 'medic',
            entityId: publicMedic.id,
            metadata: {
                plan: publicMedic.subscriptionPlan,
            },
        });

        res.status(201).json({
            id: publicMedic.id,
            name: publicMedic.name,
            email: publicMedic.email,
            subscriptionPlan: publicMedic.subscriptionPlan,
            token,
        });
    } catch (err) {
        console.error('[AuthController Register Error]', err);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }

        // Look up medic by email
        const medic = await medicService.getMedicByEmail(email);
        if (!medic) {
            return res.status(401).json({ error: 'Invalid credentials: account not found' });
        }

        if (!medic.passwordHash) {
            return res.status(401).json({ error: 'This account does not have a valid password yet. Please contact support or reset the account.' });
        }

        const isValidPassword = await bcrypt.compare(password, medic.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = signAuthToken(medic);
        const publicMedic = medicService.toPublicMedic(medic);

        await telemetryService.trackEvent({
            eventName: 'user_logged_in',
            category: 'auth',
            userId: publicMedic.id,
            clinicId: publicMedic.defaultClinicId || null,
            entityType: 'medic',
            entityId: publicMedic.id,
            metadata: {
                plan: publicMedic.subscriptionPlan,
            },
        });

        res.status(200).json({
            id: publicMedic.id,
            name: publicMedic.name,
            email: publicMedic.email,
            subscriptionPlan: publicMedic.subscriptionPlan,
            token,
        });
    } catch (err) {
        console.error('[AuthController Login Error]', err);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const medicId = extractMedicIdFromAuthHeader(authHeader);
        if (!medicId) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const medic = await medicService.getMedicProfile(medicId);
        if (!medic) {
            return res.status(401).json({ error: 'Session invalid: Medic not found. Please log in again.' });
        }

        res.json(medic);
    } catch (err) {
        console.error('[AuthController getMe Error]', err);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        await medicService.createPasswordResetRequest(email);
        res.json({ message: 'If an account exists for this email, a reset email has been sent.' });
    } catch (err) {
        console.error('[AuthController forgotPassword Error]', err);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const result = await medicService.resetPassword(req.body);
        res.json(result);
    } catch (err) {
        console.error('[AuthController resetPassword Error]', err);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        let medicId = null;
        try {
            const payload = verifyAuthToken(authHeader.split(' ')[1]);
            medicId = payload.sub;
        } catch {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const result = await medicService.changePassword({
            medicId,
            currentPassword: req.body.currentPassword,
            newPassword: req.body.newPassword,
        });

        res.json(result);
    } catch (err) {
        console.error('[AuthController changePassword Error]', err);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};
