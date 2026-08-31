const MedicService = require('../services/MedicService');
const SessionService = require('../services/SessionService');
const GoogleAuthService = require('../services/GoogleAuthService');
const bcrypt = require('bcryptjs');
const { signAuthToken, extractMedicIdFromRequest } = require('../utils/auth');
const medicService = new MedicService();
const sessionService = new SessionService();
const googleAuthService = new GoogleAuthService();

/**
 * Auth Controller
 * Handles registration (medic account creation), login and the refresh session.
 */

exports.register = async (req, res) => {
    try {
        const { name, email, password, analyticsMetadata } = req.body;

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
        const session = await sessionService.issue(newMedic.id);
        const publicMedic = medicService.toPublicMedic(newMedic);

        const UserAnalyticsService = require('../services/UserAnalyticsService');
        const analyticsService = new UserAnalyticsService();
        try {
            await analyticsService.trackLogin(publicMedic.id);
            await analyticsService.trackOnboarding(publicMedic.id, 'registered');

            const registrationMetadata = {};
            if (typeof analyticsMetadata?.gtagClientId === 'string' && analyticsMetadata.gtagClientId.trim()) {
                registrationMetadata.gtagClientId = analyticsMetadata.gtagClientId.trim();
            }

            if (Object.keys(registrationMetadata).length > 0) {
                await analyticsService.trackMetadata(publicMedic.id, registrationMetadata);
            }
        } catch (analyticsError) {
            console.error('[Analytics] Failed to track registration:', analyticsError);
        }

        res.status(201).json({
            id: publicMedic.id,
            name: publicMedic.name,
            email: publicMedic.email,
            subscriptionPlan: publicMedic.subscriptionPlan,
            token,
            refreshToken: session.token,
        });

        // Welcome mail runs after the response so a slow or broken provider cannot
        // delay or fail the signup itself.
        Promise.resolve(medicService.sendWelcomeEmail(publicMedic)).catch((error) => {
            console.error('[AuthController Register] Welcome email error:', error.message);
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
        const session = await sessionService.issue(medic.id);
        const publicMedic = medicService.toPublicMedic(medic);

        const UserAnalyticsService = require('../services/UserAnalyticsService');
        const analyticsService = new UserAnalyticsService();
        try {
            await analyticsService.trackLogin(publicMedic.id);
        } catch (analyticsError) {
            console.error('[Analytics] Failed to track login:', analyticsError);
        }

        res.status(200).json({
            id: publicMedic.id,
            name: publicMedic.name,
            email: publicMedic.email,
            subscriptionPlan: publicMedic.subscriptionPlan,
            token,
            refreshToken: session.token,
        });
    } catch (err) {
        console.error('[AuthController Login Error]', err);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

/**
 * Sign-in with a Google Identity Services ID token from the browser. Existing accounts
 * are matched by verified email, so the same person keeps their data and can still use
 * their password.
 */
exports.googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        const claims = await googleAuthService.verifyIdToken(idToken);
        const { medic, isNewlyCreated } = await medicService.findOrCreateGoogleAccount(claims);

        const token = signAuthToken(medic);
        const session = await sessionService.issue(medic.id);
        const publicMedic = medicService.toPublicMedic(medic);

        const UserAnalyticsService = require('../services/UserAnalyticsService');
        const analyticsService = new UserAnalyticsService();
        try {
            await analyticsService.trackLogin(publicMedic.id);
            if (isNewlyCreated) {
                await analyticsService.trackOnboarding(publicMedic.id, 'registered_google');
            }
        } catch (analyticsError) {
            console.error('[Analytics] Failed to track Google login:', analyticsError);
        }

        res.status(isNewlyCreated ? 201 : 200).json({
            id: publicMedic.id,
            name: publicMedic.name,
            email: publicMedic.email,
            subscriptionPlan: publicMedic.subscriptionPlan,
            token,
            refreshToken: session.token,
        });

        if (isNewlyCreated) {
            Promise.resolve(medicService.sendWelcomeEmail(publicMedic)).catch((error) => {
                console.error('[AuthController googleLogin] Welcome email error:', error.message);
            });
        }
    } catch (err) {
        console.error('[AuthController googleLogin Error]', err);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const medicId = extractMedicIdFromRequest(req);
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
        const medicId = extractMedicIdFromRequest(req);
        if (!medicId) {
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

exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        const rotated = await sessionService.rotate(refreshToken);
        if (!rotated.valid) {
            return res.status(401).json({ error: 'Invalid or expired refresh token', reason: rotated.reason });
        }

        const medic = await medicService.getMedicProfile(rotated.medicId);
        if (!medic) {
            return res.status(401).json({ error: 'User not found' });
        }

        res.json({
            token: signAuthToken(medic),
            refreshToken: rotated.token,
        });
    } catch (err) {
        console.error('[AuthController refresh Error]', err);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};

exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await sessionService.revoke(refreshToken);
        }
        res.json({ success: true });
    } catch (err) {
        console.error('[AuthController logout Error]', err);
        res.status(500).json({ error: err.message });
    }
};
