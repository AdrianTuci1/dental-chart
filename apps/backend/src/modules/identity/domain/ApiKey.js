const crypto = require('crypto');

/**
 * Value object for the API keys the integration API accepts. A key is shown once and
 * only its SHA-256 hash is stored, so `mask` is the only readable representation that
 * may travel back to a client.
 */
class ApiKey {
    constructor(rawKey) {
        this.rawKey = rawKey;
        this.hash = ApiKey.hash(rawKey);
        this.prefix = ApiKey.prefixOf(rawKey);
    }

    static generate() {
        return new ApiKey(`dc_${crypto.randomBytes(24).toString('hex')}`);
    }

    static hash(rawKey) {
        return crypto.createHash('sha256').update(String(rawKey)).digest('hex');
    }

    static prefixOf(rawKey = '') {
        return rawKey ? rawKey.slice(0, 10) : null;
    }

    static mask(rawKey = '') {
        if (!rawKey) return null;
        if (rawKey.length <= 10) return rawKey;
        return `${rawKey.slice(0, 6)}...${rawKey.slice(-4)}`;
    }

    get masked() {
        return ApiKey.mask(this.rawKey);
    }

    /** The columns written next to the medic record. The raw key never is. */
    toRecord() {
        return { hash: this.hash, prefix: this.prefix };
    }
}

module.exports = { ApiKey };
