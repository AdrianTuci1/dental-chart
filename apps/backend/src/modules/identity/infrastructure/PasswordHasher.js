const bcrypt = require('bcryptjs');

/**
 * Adapter around bcrypt. Password hashing is infrastructure, so the account services
 * depend on hash/compare and never on the library itself.
 */
class PasswordHasher {
    constructor({ saltRounds = 10, hasher = bcrypt } = {}) {
        this.saltRounds = saltRounds;
        this.hasher = hasher;
    }

    hash(plainPassword) {
        return this.hasher.hash(plainPassword, this.saltRounds);
    }

    compare(plainPassword, passwordHash) {
        return this.hasher.compare(plainPassword, passwordHash);
    }
}

module.exports = { PasswordHasher };
