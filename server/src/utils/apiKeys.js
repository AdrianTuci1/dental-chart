const crypto = require('crypto');

const generateApiKey = () => `dc_${crypto.randomBytes(24).toString('hex')}`;

const maskApiKey = (apiKey = '') => {
    if (!apiKey) return null;
    if (apiKey.length <= 10) return apiKey;
    return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
};

module.exports = {
    generateApiKey,
    maskApiKey,
};
