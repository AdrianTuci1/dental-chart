const crypto = require('crypto');

const generateApiKey = () => `dc_${crypto.randomBytes(24).toString('hex')}`;

const hashApiKey = (apiKey) => crypto.createHash('sha256').update(String(apiKey)).digest('hex');

const getApiKeyPrefix = (apiKey = '') => apiKey ? apiKey.slice(0, 10) : null;

const createApiKeyRecord = () => {
    const rawKey = generateApiKey();
    return {
        rawKey,
        hash: hashApiKey(rawKey),
        prefix: getApiKeyPrefix(rawKey),
    };
};

const maskApiKey = (apiKey = '') => {
    if (!apiKey) return null;
    if (apiKey.length <= 10) return apiKey;
    return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
};

module.exports = {
    generateApiKey,
    hashApiKey,
    getApiKeyPrefix,
    createApiKeyRecord,
    maskApiKey,
};
