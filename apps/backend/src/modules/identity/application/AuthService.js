const SessionService = require('./SessionService');
const UserAnalyticsService = require('../../analytics/application/UserAnalyticsService');
const GoogleAuthService = require('../infrastructure/GoogleAuthService');
const { PasswordHasher } = require('../infrastructure/PasswordHasher');
const { Password } = require('../domain/Password');
const { authTokenService } = require('./AuthTokenService');
const {
    BadRequestError,
    UnauthorizedError,
} = require('../../../shared/errors/AppError');

/**
 * Authentication use cases. The controller only moves data in and out; password hashing,
 * session issuing and analytics live here, so the same rules surface on every host.
 */
class AuthService {
    constructor({
        medicService,
        sessionService = new SessionService(),
        authTokenService: tokenService = authTokenService,
        passwordHasher = new PasswordHasher(),
        googleAuthService = new GoogleAuthService(),
        analyticsService = new UserAnalyticsService(),
    } = {}) {
        this.medicService = medicService;
        this.sessionService = sessionService;
        this.authTokenService = tokenService;
        this.passwordHasher = passwordHasher;
        this.googleAuthService = googleAuthService;
        this.analyticsService = analyticsService;
    }

    async register({ name, email, password, analyticsMetadata } = {}) {
        if (!name || !email || !password) {
            throw new BadRequestError('name, email and password are required');
        }

        Password.assertValid(password);

        const newMedic = await this.medicService.createMedic({
            name,
            email,
            passwordHash: await this.passwordHasher.hash(password),
        });

        const session = await this.sessionService.issue(newMedic.id);
        const publicMedic = this.medicService.toPublicMedic(newMedic);

        await this.trackAnalytics(async (analytics) => {
            await analytics.trackLogin(publicMedic.id);
            await analytics.trackOnboarding(publicMedic.id, 'registered');

            const registrationMetadata = {};
            if (typeof analyticsMetadata?.gtagClientId === 'string' && analyticsMetadata.gtagClientId.trim()) {
                registrationMetadata.gtagClientId = analyticsMetadata.gtagClientId.trim();
            }

            if (Object.keys(registrationMetadata).length > 0) {
                await analytics.trackMetadata(publicMedic.id, registrationMetadata);
            }
        }, 'registration');

        return {
            statusCode: 201,
            body: this.authPayload(publicMedic, session.token),
            welcomeMedic: publicMedic,
        };
    }

    async login({ email, password } = {}) {
        if (!email || !password) {
            throw new BadRequestError('email and password are required');
        }

        const medic = await this.medicService.getMedicByEmail(email);
        if (!medic) {
            throw new UnauthorizedError('Invalid credentials: account not found');
        }

        if (!medic.passwordHash) {
            throw new UnauthorizedError('This account does not have a valid password yet. Please contact support or reset the account.');
        }

        const isValidPassword = await this.passwordHasher.compare(password, medic.passwordHash);
        if (!isValidPassword) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const session = await this.sessionService.issue(medic.id);
        const publicMedic = this.medicService.toPublicMedic(medic);

        await this.trackAnalytics(async (analytics) => {
            await analytics.trackLogin(publicMedic.id);
        }, 'login');

        return {
            statusCode: 200,
            body: this.authPayload(publicMedic, session.token),
        };
    }

    /**
     * Sign-in with a Google Identity Services ID token from the browser. Existing accounts
     * are matched by verified email, so the same person keeps their data and can still use
     * their password.
     */
    async googleLogin({ idToken } = {}) {
        const claims = await this.googleAuthService.verifyIdToken(idToken);
        const { medic, isNewlyCreated } = await this.medicService.findOrCreateGoogleAccount(claims);

        const session = await this.sessionService.issue(medic.id);
        const publicMedic = this.medicService.toPublicMedic(medic);

        await this.trackAnalytics(async (analytics) => {
            await analytics.trackLogin(publicMedic.id);
            if (isNewlyCreated) {
                await analytics.trackOnboarding(publicMedic.id, 'registered_google');
            }
        }, 'Google login');

        return {
            statusCode: isNewlyCreated ? 201 : 200,
            body: this.authPayload(publicMedic, session.token),
            welcomeMedic: isNewlyCreated ? publicMedic : null,
        };
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw new UnauthorizedError('Refresh token required');
        }

        const rotated = await this.sessionService.rotate(refreshToken);
        if (!rotated.valid) {
            throw new UnauthorizedError('Invalid or expired refresh token', {
                meta: { reason: rotated.reason },
            });
        }

        const medic = await this.medicService.getMedicProfile(rotated.medicId);
        if (!medic) {
            throw new UnauthorizedError('User not found');
        }

        return {
            statusCode: 200,
            body: {
                token: this.authTokenService.sign(medic),
                refreshToken: rotated.token,
            },
        };
    }

    async logout(refreshToken) {
        if (refreshToken) {
            await this.sessionService.revoke(refreshToken);
        }

        return { success: true };
    }

    async getMe(medicId) {
        if (!medicId) {
            throw new UnauthorizedError('Invalid or expired token');
        }

        const medic = await this.medicService.getMedicProfile(medicId);
        if (!medic) {
            throw new UnauthorizedError('Session invalid: Medic not found. Please log in again.');
        }

        return medic;
    }

    async forgotPassword(email) {
        await this.medicService.createPasswordResetRequest(email);
        return { message: 'If an account exists for this email, a reset email has been sent.' };
    }

    resetPassword(payload = {}) {
        return this.medicService.resetPassword(payload);
    }

    changePassword({ medicId, currentPassword, newPassword } = {}) {
        return this.medicService.changePassword({ medicId, currentPassword, newPassword });
    }

    authPayload(publicMedic, refreshToken) {
        return {
            id: publicMedic.id,
            name: publicMedic.name,
            email: publicMedic.email,
            subscriptionPlan: publicMedic.subscriptionPlan,
            token: this.authTokenService.sign(publicMedic),
            refreshToken,
        };
    }

    /**
     * Telemetry is best effort: a failure here must never fail the sign-in itself.
     */
    async trackAnalytics(action, label) {
        try {
            await action(this.analyticsService);
        } catch (error) {
            console.error(`[Analytics] Failed to track ${label}:`, error);
        }
    }
}

module.exports = AuthService;
