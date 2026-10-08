const EmailService = require('../services/EmailService');

/**
 * Shared by every host, so the health answer cannot drift between the local process,
 * the Lambda package and the Worker.
 */
const healthPayload = () => {
    const { configured, provider } = EmailService.describeProvider();

    return {
        status: 'OK',
        message: 'Dental Chart Server is running',
        email: { configured, provider },
    };
};

module.exports = { healthPayload };
