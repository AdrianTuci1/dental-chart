const { ApiKey } = require('./ApiKey');

// Bumped whenever the default-workspace migration needs to run again for a medic.
const WORKSPACE_MIGRATION_VERSION = 1;

/**
 * Medic account entity.
 *
 * It wraps the stored record so the rules about what is public, how a free plan is
 * recognised, and how a Google identity may be attached live in one place instead of
 * being repeated by the application services.
 */
class Medic {
    constructor(record = {}) {
        this.record = { ...record };
    }

    static from(record) {
        return record ? new Medic(record) : null;
    }

    get id() { return this.record.id; }
    get name() { return this.record.name; }
    get email() { return this.record.email; }
    get subscriptionPlan() { return this.record.subscriptionPlan || 'free'; }
    get subscriptionStatus() {
        // Older records and manually granted plans predate Stripe, so a non-free plan
        // without a status stays usable. Stripe writes an explicit status on every sync.
        return this.record.subscriptionStatus || (this.isFreePlan() ? 'inactive' : 'active');
    }
    get billingInterval() { return this.record.billingInterval || null; }
    get defaultClinicId() { return this.record.defaultClinicId; }
    get passwordHash() { return this.record.passwordHash; }
    get googleId() { return this.record.googleId; }
    get authProviders() { return this.record.authProviders || []; }
    get status() { return this.record.status || 'active'; }

    isDisabled() {
        return this.status === 'disabled';
    }

    isFreePlan() {
        return this.subscriptionPlan === 'free';
    }

    /** A paid plan counts only while Stripe reports it as active or trialing. */
    isLicensed() {
        return !this.isFreePlan()
            && ['active', 'trialing'].includes(this.subscriptionStatus);
    }

    hasPassword() {
        return Boolean(this.record.passwordHash);
    }

    isGoogleLinked() {
        return Boolean(this.record.googleId);
    }

    isGoogleLinkedTo(googleId) {
        return this.isGoogleLinked() && this.record.googleId !== googleId;
    }

    /** Columns written when a Google identity is attached to an existing account. */
    linkGoogle(googleId) {
        // A legacy password account may not carry authProviders yet. Record the provider
        // it already uses so the list stays truthful after the Google link is added.
        const providers = this.authProviders.length ? this.authProviders : ['password'];

        return {
            googleId,
            googleEmailVerified: true,
            authProviders: [...new Set([...providers, 'google'])],
        };
    }

    hasWorkspaceMigration() {
        return Boolean(this.defaultClinicId)
            && this.record.workspaceMigrationVersion === WORKSPACE_MIGRATION_VERSION;
    }

    isPasswordResetExpired(now = Date.now()) {
        return !this.record.passwordResetExpiresAt
            || new Date(this.record.passwordResetExpiresAt).getTime() < now;
    }

    maskedApiKey() {
        if (this.record.apiKey) {
            return ApiKey.mask(this.record.apiKey);
        }

        if (this.record.apiKeyPrefix) {
            return `${this.record.apiKeyPrefix}...`;
        }

        return null;
    }

    /** Response-safe view: the credential columns never leave the server. */
    toPublic() {
        const {
            passwordHash,
            apiKeyHash,
            apiKeyPrefix,
            stripeCustomerId,
            stripeSubscriptionId,
            ...publicRecord
        } = this.record;
        return publicRecord;
    }

    toRecord() {
        return { ...this.record };
    }
}

module.exports = { Medic, WORKSPACE_MIGRATION_VERSION };
