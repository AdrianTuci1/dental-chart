const ENDPOINT = 'https://api.resend.com/emails';

const missingConfig = (env = process.env) => [
    ['RESEND_API_KEY', env.RESEND_API_KEY],
    ['EMAIL_FROM', env.EMAIL_FROM],
]
    .filter(([, value]) => !value)
    .map(([key]) => key);

module.exports = {
    name: 'resend',
    summary: 'Resend transactional email API',
    requiredEnv: ['RESEND_API_KEY', 'EMAIL_FROM'],
    missingConfig,
    resolveFrom: (env) => env.EMAIL_FROM,

    async send({ from, to, subject, text, html, env = process.env }) {
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ from, to, subject, text, html }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(`resend responded ${response.status}: ${payload.message || payload.name || 'request failed'}`);
        }

        // Resend accepts asynchronously; bounces arrive later through webhooks.
        return { messageId: payload.id || null };
    },
};
