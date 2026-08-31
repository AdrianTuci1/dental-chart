const API_BASE = 'https://api.cloudflare.com/client/v4';

const missingConfig = (env = process.env) => [
    ['CLOUDFLARE_ACCOUNT_ID', env.CLOUDFLARE_ACCOUNT_ID],
    ['CLOUDFLARE_EMAIL_API_TOKEN', env.CLOUDFLARE_EMAIL_API_TOKEN],
    ['EMAIL_FROM', env.EMAIL_FROM],
]
    .filter(([, value]) => !value)
    .map(([key]) => key);

module.exports = {
    name: 'cloudflare',
    summary: 'Cloudflare Email Service (Email Sending) REST API',
    requiredEnv: ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_EMAIL_API_TOKEN', 'EMAIL_FROM'],
    missingConfig,
    resolveFrom: (env) => env.EMAIL_FROM,

    async send({ from, to, subject, text, html, env = process.env }) {
        const url = `${API_BASE}/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/email/sending/send`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${env.CLOUDFLARE_EMAIL_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ from, to, subject, text, html }),
        });

        const payload = await response.json().catch(() => ({}));
        const firstError = Array.isArray(payload.errors) ? payload.errors[0] : null;

        if (!response.ok || payload.success === false) {
            throw new Error(`cloudflare responded ${response.status}: ${firstError ? `${firstError.code} ${firstError.message}` : 'request failed'}`);
        }

        const result = payload.result || {};
        const permanentBounces = result.permanent_bounces || [];

        if (permanentBounces.length) {
            const error = new Error(`recipient permanently bounced: ${permanentBounces.join(', ')}`);
            error.reason = 'hard_bounce';
            throw error;
        }

        return { queued: (result.queued || []).length > 0 };
    },
};
