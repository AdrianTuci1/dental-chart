/**
 * Gmail transport over the REST API, with the OAuth refresh token exchanged for an
 * access token. Plain fetch keeps this working on Node and on the Worker runtime; the
 * googleapis client pulled in a large tree of Node-only code for two HTTP calls.
 */
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const SEND_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users';

// Reused across sends; Google hands out tokens that live for an hour.
let cachedAccessToken = null;

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

const requestAccessToken = async (env) => {
    const now = Date.now();

    if (cachedAccessToken && cachedAccessToken.expiresAt > now) {
        return cachedAccessToken.value;
    }

    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: env.GMAIL_CLIENT_ID,
            client_secret: env.GMAIL_CLIENT_SECRET,
            refresh_token: env.GMAIL_REFRESH_TOKEN,
            grant_type: 'refresh_token',
        }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload.access_token) {
        throw new Error(`gmail token endpoint responded ${response.status}: ${payload.error_description || payload.error || 'no access token'}`);
    }

    const lifetimeSeconds = Number(payload.expires_in) || 3600;
    cachedAccessToken = {
        value: payload.access_token,
        // Renew a minute early so a token cannot expire between here and the send.
        expiresAt: now + Math.max(30, lifetimeSeconds - 60) * 1000,
    };

    return cachedAccessToken.value;
};

module.exports = {
    name: 'gmail',
    summary: 'Gmail API over an OAuth refresh token',
    requiredEnv: ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'GMAIL_USER'],
    missingConfig,
    resolveFrom: (env) => env.EMAIL_FROM || env.GMAIL_FROM_EMAIL || 'no-reply@pixtooth.com',

    async send({ from, to, subject, text, html, env = process.env }) {
        const accessToken = await requestAccessToken(env);
        const userId = env.GMAIL_USER || from;

        const response = await fetch(`${SEND_ENDPOINT}/${encodeURIComponent(userId)}/messages/send`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw: buildRawMessage({ from, to, subject, text, html }) }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(`gmail responded ${response.status}: ${payload.error?.message || 'request failed'}`);
        }

        return { messageId: payload.id || null };
    },
};
