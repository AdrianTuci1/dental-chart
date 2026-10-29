const { describeConfig } = require('../../../config');
const { BadRequestError } = require('../../../shared/errors/AppError');

/**
 * Read-only view of how this deployment is configured, plus the one action that proves
 * outbound email works. It never returns secret values, only whether they are present.
 */
class ConfigurationService {
    constructor({ config, emailService, medicService }) {
        this.config = config;
        this.emailService = emailService;
        this.medicService = medicService;
    }

    describe() {
        return describeConfig(this.config);
    }

    async sendTestEmail(userId) {
        const medic = await this.medicService.getMedic(userId);

        if (!medic?.email) {
            throw new BadRequestError('Your account has no email address to send a test to');
        }

        const result = await this.emailService.sendEmail({
            to: medic.email,
            subject: 'Pixtooth configuration test',
            text: [
                'This is a test message from the Pixtooth settings screen.',
                '',
                'If you can read it, outbound email is configured correctly for this deployment.',
            ].join('\n'),
            html: `
                <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
                    <h2>Pixtooth configuration test</h2>
                    <p>This is a test message from the Pixtooth settings screen.</p>
                    <p>If you can read it, outbound email is configured correctly for this deployment.</p>
                </div>
            `,
            template: 'configuration_test',
            userId,
        });

        return { to: medic.email, ...result };
    }
}

module.exports = ConfigurationService;
