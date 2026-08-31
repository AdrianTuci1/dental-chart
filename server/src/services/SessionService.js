const crypto = require('crypto');
const RefreshTokenRepository = require('../models/repositories/RefreshTokenRepository');
const { parseDurationMs } = require('../utils/auth');

/**
 * Sessions are long lived on purpose: a dentist who returns from a holiday or a sick
 * week must not be asked for a password again. Every refresh writes a new row with a
 * fresh expiry, so the window only counts from the last time the app was used: a year
 * of real inactivity is what ends a session. DynamoDB TTL removes the row when the
 * window lapses, so abandoned sessions cannot pile up in the table.
 */
const DEFAULT_WINDOW = '365d';

// A rotated token replayed within this window is not an attacker: it is a second tab
// or a refresh whose response never reached the browser. Those replays get a fresh
// token in the same family instead of killing the session. Beyond the window, reuse
// means the secret leaked and the whole family is revoked.
const DEFAULT_REUSE_GRACE_MS = 10000;

class SessionService {
    constructor() {
        this.repository = new RefreshTokenRepository();
    }

    static reuseGraceMs() {
        const configured = Number(process.env.REFRESH_TOKEN_REUSE_GRACE_MS);
        return Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_REUSE_GRACE_MS;
    }

    static windowMs() {
        return parseDurationMs(process.env.REFRESH_TOKEN_EXPIRES_IN || DEFAULT_WINDOW)
            || parseDurationMs(DEFAULT_WINDOW);
    }

    static futureExpiry(offsetMs = 0) {
        return new Date(Date.now() + SessionService.windowMs() + offsetMs).toISOString();
    }

    async issue(medicId, { familyId = null } = {}) {
        if (!medicId) {
            throw new Error('medicId is required to issue a session');
        }

        const token = RefreshTokenRepository.newToken();
        const tokenHash = this.repository.hash(token);
        const expiresAt = SessionService.futureExpiry();

        await this.repository.save({
            tokenHash,
            medicId,
            familyId: familyId || crypto.randomUUID(),
            expiresAt,
        });

        return { token, tokenHash, expiresAt };
    }

    /**
     * @returns {{ valid: boolean, reason?: 'missing'|'not_found'|'expired'|'revoked'|'reused'|'concurrent', record?: object, tokenHash?: string }}
     *
     * `concurrent` is the soft reuse case: the token was rotated moments ago, so the
     * caller is expected to treat it as a parallel refresh rather than an attack.
     */
    async verify(token) {
        if (!token) {
            return { valid: false, reason: 'missing' };
        }

        const tokenHash = this.repository.hash(token);
        const record = await this.repository.findByHash(tokenHash);

        if (!record) {
            return { valid: false, reason: 'not_found' };
        }

        if (new Date(record.expiresAt).getTime() <= Date.now()) {
            await this.repository.remove(tokenHash);
            return { valid: false, reason: 'expired' };
        }

        const revocation = await this.repository.findFamilyRevocation(record.familyId);
        if (revocation) {
            return { valid: false, reason: 'revoked' };
        }

        if (record.rotatedToHash) {
            const rotatedAt = Date.parse(record.rotatedAt || record.updatedAt || '');
            const insideGrace = Number.isFinite(rotatedAt) && Date.now() - rotatedAt <= SessionService.reuseGraceMs();

            if (insideGrace) {
                // Concurrent refresh from another tab, or a response the browser never
                // received. rotate() answers it with a new token in the same family.
                return { valid: false, reason: 'concurrent', record, tokenHash };
            }

            // A rotated token replayed after the grace window means the secret leaked.
            await this.repository.revokeFamily(record.familyId, SessionService.futureExpiry());
            await this.repository.remove(tokenHash);
            return { valid: false, reason: 'reused' };
        }

        return { valid: true, record, tokenHash };
    }

    /**
     * Rotates in one step: the presented token is marked as used, and the replacement
     * inherits the family id so a later revocation covers both.
     */
    async rotate(token) {
        const checked = await this.verify(token);

        if (!checked.valid && checked.reason === 'concurrent') {
            const replayed = await this.issue(checked.record.medicId, { familyId: checked.record.familyId });
            return {
                valid: true,
                medicId: checked.record.medicId,
                token: replayed.token,
                expiresAt: replayed.expiresAt,
            };
        }

        if (!checked.valid) {
            return checked;
        }

        const next = await this.issue(checked.record.medicId, { familyId: checked.record.familyId });
        await this.repository.markRotated(checked.tokenHash, next.tokenHash);

        return { valid: true, medicId: checked.record.medicId, token: next.token, expiresAt: next.expiresAt };
    }

    async revoke(token) {
        if (!token) {
            return false;
        }

        await this.repository.remove(this.repository.hash(token));
        return true;
    }

    async revokeAllForMedic(medicId) {
        const records = await this.repository.listByMedicId(medicId);

        for (const record of records) {
            await this.repository.revokeFamily(record.familyId, record.expiresAt);
            await this.repository.remove(record.tokenHash);
        }

        return records.length;
    }
}

module.exports = SessionService;
