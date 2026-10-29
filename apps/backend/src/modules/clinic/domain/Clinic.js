const crypto = require('crypto');

const MANAGER_ROLES = new Set(['owner', 'admin']);

/**
 * Clinic membership entity. Authorization questions ("is this person an active member?",
 * "may they manage the workspace?") belong here, so every application service applies
 * the same rule.
 */
class ClinicMembership {
    constructor(record = {}) {
        this.record = { ...record };
    }

    static from(record) {
        return record ? new ClinicMembership(record) : null;
    }

    get clinicId() { return this.record.clinicId; }
    get medicId() { return this.record.medicId; }
    get role() { return this.record.role; }
    get status() { return this.record.status; }

    isActive() {
        return this.record.status === 'active';
    }

    canManage() {
        return this.isActive() && MANAGER_ROLES.has(this.record.role);
    }

    isOwner() {
        return this.record.role === 'owner';
    }

    toRecord() {
        return { ...this.record };
    }
}

/**
 * Workspace entity: a personal or shared clinic. Display ids and the "default workspace"
 * rule are derived here rather than in the service, which keeps the rule testable.
 */
class Clinic {
    constructor(record = {}) {
        this.record = { ...record };
    }

    static from(record) {
        return record ? new Clinic(record) : null;
    }

    get id() { return this.record.id; }
    get name() { return this.record.name; }
    get type() { return this.record.type; }
    get isDefault() { return this.record.isDefault === true; }
    get ownerMedicId() { return this.record.ownerMedicId; }

    /**
     * The default workspace is created with the account and is tied to its life.
     * Legacy accounts may predate the flag, so `type` and the owner pointer count too.
     */
    isDefaultWorkspace(owner = null) {
        if (this.isDefault || this.record.type === 'personal') {
            return true;
        }

        return Boolean(owner?.defaultClinicId)
            && String(owner.defaultClinicId) === String(this.record.id);
    }

    displayIdOrDefault() {
        return this.record.displayId || Clinic.fallbackDisplayId(this.record.id);
    }

    toRecord() {
        return { ...this.record };
    }

    static displayIdFor(name) {
        const prefix = String(name || 'ORG')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 3)
            .padEnd(3, 'X');
        const suffix = crypto.randomBytes(3).toString('hex').slice(0, 6).toUpperCase();
        return `${prefix}-${suffix}`;
    }

    static fallbackDisplayId(id) {
        const suffix = String(id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || 'XXXXXX';
        return `ORG-${suffix}`;
    }
}

module.exports = { Clinic, ClinicMembership };
