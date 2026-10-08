const { selectTransport } = require('./email');

const LOG_PREFIX = '[EmailService]';
const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Templates plus provider-agnostic delivery. The transport is chosen by EMAIL_PROVIDER
 * (see src/services/email/index.js), so switching Resend <-> Cloudflare <-> Gmail is a
 * configuration change only.
 */
class EmailService {
    static configWarningShown = null;

    /**
     * Resolves the configured transport without sending anything. Used at boot so a
     * deployment that cannot deliver mail says so in its startup log.
     */
    static describeProvider(env = process.env) {
        const { transport, reason, detail } = selectTransport(env);

        return transport
            ? { configured: true, provider: transport.name, detail: null }
            : { configured: false, provider: 'none', reason, detail };
    }

    async sendPasswordResetEmail({ to, resetUrl, code, expiresInMinutes = 15, userId = null }) {
        const subject = 'Reset your Pixtooth password';
        const text = [
            'You requested a password reset for your Pixtooth account.',
            '',
            `Reset link: ${resetUrl}`,
            `Verification code: ${code}`,
            '',
            `This link and code expire in ${expiresInMinutes} minutes.`,
            'If you did not request this, you can ignore this email.',
        ].join('\n');

        const html = `
            <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
                <h2>Reset your Pixtooth password</h2>
                <p>You requested a password reset for your Pixtooth account.</p>
                <p>
                    <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;">
                        Reset password
                    </a>
                </p>
                <p>Or use this verification code:</p>
                <p style="font-size:28px;font-weight:700;letter-spacing:6px;">${code}</p>
                <p>This link and code expire in ${expiresInMinutes} minutes.</p>
                <p>If you did not request this, you can ignore this email.</p>
            </div>
        `;

        return this.sendEmail({ to, subject, text, html, template: 'password_reset', userId });
    }

    async sendWelcomeEmail({ to, name, userId = null }) {
        const subject = 'Welcome to Pixtooth';
        const greeting = name ? `Hi ${name},` : 'Hi,';
        const text = [
            `${greeting} your Pixtooth account is ready.`,
            '',
            'You can now chart teeth, keep patient records and invite your team into a shared workspace.',
            'Open the app: https://app.pixtooth.com',
            '',
            'If you did not create this account, you can reset the password from the sign-in page.',
        ].join('\n');

        const html = `
            <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
                <h2>Welcome to Pixtooth</h2>
                <p>${greeting} your Pixtooth account is ready.</p>
                <p>You can now chart teeth, keep patient records and invite your team into a shared workspace.</p>
                <p>
                    <a href="https://app.pixtooth.com" style="display:inline-block;padding:12px 18px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:8px;">
                        Open Pixtooth
                    </a>
                </p>
                <p>If you did not create this account, you can reset the password from the sign-in page.</p>
            </div>
        `;

        return this.sendEmail({ to, subject, text, html, template: 'welcome', userId });
    }

    async sendWorkspaceInviteEmail({ to, workspaceName, inviterName, inviteCode, userId = null }) {
        const subject = `${inviterName || 'A colleague'} invited you to ${workspaceName}`;
        const text = [
            `${inviterName || 'Someone'} invited you to the "${workspaceName}" workspace on Pixtooth.`,
            '',
            `Accept the invitation with this code: ${inviteCode}`,
            'Sign in or create an account at https://app.pixtooth.com to join.',
        ].join('\n');

        const html = `
            <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
                <h2>${workspaceName}</h2>
                <p>${inviterName || 'Someone'} invited you to the "${workspaceName}" workspace on Pixtooth.</p>
                <p>Accept the invitation with this code:</p>
                <p style="font-size:28px;font-weight:700;letter-spacing:6px;">${inviteCode}</p>
                <p>
                    <a href="https://app.pixtooth.com" style="display:inline-block;padding:12px 18px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:8px;">
                        Open Pixtooth
                    </a>
                </p>
            </div>
        `;

        return this.sendEmail({ to, subject, text, html, template: 'workspace_invite', userId });
    }

    async sendEmail({ to, subject, text, html, template = 'custom', userId = null }) {
        if (!to) {
            return this.reportFailure({ provider: 'none', template, userId, reason: 'invalid_recipient', detail: 'to is required' });
        }

        const { transport, reason, detail } = selectTransport(process.env);

        if (!transport) {
            this.warnConfigProblem(reason, detail);

            if (!isProduction()) {
                // Local convenience: the reset code stays readable in the dev console.
                console.log(`${LOG_PREFIX} dev fallback body`, { to, subject, text });
            }

            return this.reportFailure({ provider: 'none', template, userId, to, reason, detail });
        }

        const from = transport.resolveFrom(process.env);

        try {
            const meta = await transport.send({ from, to, subject, text, html, env: process.env });

            console.log(`${LOG_PREFIX} delivered`, JSON.stringify({
                template,
                provider: transport.name,
                to,
                queued: Boolean(meta && meta.queued),
            }));

            return { delivered: true, provider: transport.name, template };
        } catch (error) {
            return this.reportFailure({
                provider: transport.name,
                template,
                userId,
                to,
                reason: error.reason || 'provider_error',
                detail: error.message,
            });
        }
    }

    /**
     * Delivery problems never throw: the caller decides what the user sees, while the
     * structured log line and the returned reason make a silent failure impossible.
     */
    reportFailure({ provider, template, userId, to = null, reason, detail }) {
        console.error(`${LOG_PREFIX} delivery_failed`, JSON.stringify({
            template,
            provider,
            reason,
            detail,
            to,
            userId,
        }));

        return { delivered: false, provider, template, reason, detail };
    }

    warnConfigProblem(reason, detail) {
        if (EmailService.configWarningShown === reason) {
            return;
        }

        EmailService.configWarningShown = reason;
        console.warn(`${LOG_PREFIX} email is not usable (${detail}). Every send will fail until this is fixed.`);
    }
}

module.exports = EmailService;
