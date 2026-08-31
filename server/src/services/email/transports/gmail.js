const { google } = require('googleapis');

const missingConfig = (env = process.env) => {
    const missing = [
        ['GMAIL_CLIENT_ID', env.GMAIL_CLIENT_ID],
        ['GMAIL_CLIENT_SECRET', env.GMAIL_CLIENT_SECRET],
        ['GMAIL_REFRESH_TOKEN', env.GMAIL_REFRESH_TOKEN],
        ['GMAIL_USER or EMAIL_FROM', env.GMAIL_USER || env.EMAIL_FROM || env.GMAIL_FROM_EMAIL],
    ]
        .filter(([, value]) => !value)
        .map(([key]) => key);

    return missing;
};

const buildRawMessage = ({ from, to, subject, text, html }) => {
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
};

module.exports = {
    name: 'gmail',
    summary: 'Google Gmail API over an OAuth service account',
    requiredEnv: ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'GMAIL_USER'],
    missingConfig,
    resolveFrom: (env) => env.EMAIL_FROM || env.GMAIL_FROM_EMAIL || 'no-reply@pixtooth.com',

    async send({ from, to, subject, text, html, env = process.env }) {
        const oauth2Client = new google.auth.OAuth2(
            env.GMAIL_CLIENT_ID,
            env.GMAIL_CLIENT_SECRET,
            env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
        );
        oauth2Client.setCredentials({ refresh_token: env.GMAIL_REFRESH_TOKEN });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        await gmail.users.messages.send({
            userId: env.GMAIL_USER || from,
            requestBody: { raw: buildRawMessage({ from, to, subject, text, html }) },
        });
    },
};
