const { describeConfig } = require('../config');

/**
 * Shared by every host, so the health answer cannot drift between the local process,
 * the Lambda package and the Worker. It names the driver and providers without
 * exposing connection strings, keys or other secret values.
 */
const healthPayload = () => {
    const config = describeConfig();

    return {
        status: 'OK',
        message: 'Dental Chart Server is running',
        database: { driver: config.database.driver },
        email: {
            configured: config.email.configured,
            provider: config.email.provider,
        },
        google: { configured: config.google.configured },
    };
};

module.exports = { healthPayload };
