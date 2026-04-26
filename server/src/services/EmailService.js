const { google } = require('googleapis');

class EmailService {
    constructor() {
        this.fromEmail = process.env.GMAIL_FROM_EMAIL || 'no-reply@pixtooth.com';
        this.gmailUser = process.env.GMAIL_USER || this.fromEmail;
        this.clientId = process.env.GMAIL_CLIENT_ID;
        this.clientSecret = process.env.GMAIL_CLIENT_SECRET;
        this.refreshToken = process.env.GMAIL_REFRESH_TOKEN;
        this.redirectUri = process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground';
    }

    async sendPasswordResetEmail({ to, resetUrl, code, expiresInMinutes = 15 }) {
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

        return this.sendEmail({ to, subject, text, html });
    }

    async sendEmail({ to, subject, text, html }) {
        if (!this.clientId || !this.clientSecret || !this.refreshToken || !this.gmailUser) {
            console.log('[EmailService] Gmail credentials missing. Email not sent.');
            console.log(`[EmailService] To: ${to}`);
            console.log(`[EmailService] Subject: ${subject}`);
            console.log(text);
            return { delivered: false, provider: 'mock' };
        }

        const oauth2Client = new google.auth.OAuth2(
            this.clientId,
            this.clientSecret,
            this.redirectUri
        );
        oauth2Client.setCredentials({ refresh_token: this.refreshToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const rawMessage = this.buildRawMessage({
            from: this.fromEmail,
            to,
            subject,
            text,
            html,
        });

        await gmail.users.messages.send({
            userId: this.gmailUser,
            requestBody: {
                raw: rawMessage,
            },
        });

        return { delivered: true, provider: 'gmail' };
    }

    buildRawMessage({ from, to, subject, text, html }) {
        const boundary = `pixtooth-${Date.now()}`;
        const mimeMessage = [
            `From: ${from}`,
            `To: ${to}`,
            'Content-Type: multipart/alternative; boundary="' + boundary + '"',
            'MIME-Version: 1.0',
            `Subject: ${subject}`,
            '',
            `--${boundary}`,
            'Content-Type: text/plain; charset="UTF-8"',
            '',
            text,
            '',
            `--${boundary}`,
            'Content-Type: text/html; charset="UTF-8"',
            '',
            html,
            '',
            `--${boundary}--`,
        ].join('\n');

        return Buffer.from(mimeMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/g, '');
    }
}

module.exports = EmailService;
