const EmailService = require('../src/services/EmailService');
const MedicService = require('../src/services/MedicService');
const { selectTransport } = require('../src/services/email');

const mockTrackEmailDeliveryFailure = jest.fn().mockResolvedValue(undefined);

jest.mock('../src/services/UserAnalyticsService', () => jest.fn(() => ({
    trackEmailDeliveryFailure: mockTrackEmailDeliveryFailure,
})));

jest.mock('googleapis', () => {
    const send = jest.fn().mockResolvedValue({});

    return {
        google: {
            auth: { OAuth2: jest.fn(() => ({ setCredentials: jest.fn() })) },
            gmail: jest.fn(() => ({ users: { messages: { send } } })),
        },
        __gmailSend: send,
    };
});

// eslint-disable-next-line global-require
const { __gmailSend } = require('googleapis');

const EMAIL_ENV_KEYS = [
    'EMAIL_PROVIDER',
    'EMAIL_FROM',
    'RESEND_API_KEY',
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_EMAIL_API_TOKEN',
    'GMAIL_CLIENT_ID',
    'GMAIL_CLIENT_SECRET',
    'GMAIL_REFRESH_TOKEN',
    'GMAIL_USER',
    'GMAIL_FROM_EMAIL',
];

let envSnapshot;
let fetchMock;
let errorSpy;
let warnSpy;
let logSpy;

beforeEach(() => {
    envSnapshot = { ...process.env };
    EMAIL_ENV_KEYS.forEach((key) => delete process.env[key]);

    EmailService.configWarningShown = null;
    mockTrackEmailDeliveryFailure.mockClear();

    fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 'email_1' }) });
    global.fetch = fetchMock;

    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    process.env = envSnapshot;
    jest.restoreAllMocks();
});

const deliveryArgs = () => ({
    to: 'doctor@clinic.com',
    subject: 'Reset your password',
    text: 'body',
    html: '<p>body</p>',
    template: 'password_reset',
    userId: 'm-1',
});

describe('provider selection', () => {
    it('sends through Resend when EMAIL_PROVIDER=resend', async () => {
        Object.assign(process.env, {
            EMAIL_PROVIDER: 'resend',
            RESEND_API_KEY: 're_test',
            EMAIL_FROM: 'Pixtooth <no-reply@pixtooth.com>',
        });

        const result = await new EmailService().sendEmail(deliveryArgs());

        expect(result).toMatchObject({ delivered: true, provider: 'resend' });
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('https://api.resend.com/emails');
        expect(options.headers.Authorization).toBe('Bearer re_test');
        expect(JSON.parse(options.body)).toMatchObject({
            to: 'doctor@clinic.com',
            from: 'Pixtooth <no-reply@pixtooth.com>',
            subject: 'Reset your password',
            text: 'body',
            html: '<p>body</p>',
        });
    });

    it('sends through Cloudflare when EMAIL_PROVIDER=cloudflare', async () => {
        Object.assign(process.env, {
            EMAIL_PROVIDER: 'cloudflare',
            CLOUDFLARE_ACCOUNT_ID: 'acct_1',
            CLOUDFLARE_EMAIL_API_TOKEN: 'cf_token',
            EMAIL_FROM: 'no-reply@pixtooth.com',
        });
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                success: true,
                errors: [],
                result: { delivered: ['doctor@clinic.com'], permanent_bounces: [], queued: [] },
            }),
        });

        const result = await new EmailService().sendEmail(deliveryArgs());

        expect(result).toMatchObject({ delivered: true, provider: 'cloudflare' });
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('https://api.cloudflare.com/client/v4/accounts/acct_1/email/sending/send');
        expect(options.headers.Authorization).toBe('Bearer cf_token');
    });

    it('sends through Gmail when EMAIL_PROVIDER=gmail', async () => {
        Object.assign(process.env, {
            EMAIL_PROVIDER: 'gmail',
            GMAIL_CLIENT_ID: 'cid',
            GMAIL_CLIENT_SECRET: 'secret',
            GMAIL_REFRESH_TOKEN: 'rt',
            GMAIL_USER: 'no-reply@pixtooth.com',
        });

        const result = await new EmailService().sendEmail(deliveryArgs());

        expect(result).toMatchObject({ delivered: true, provider: 'gmail' });
        expect(__gmailSend).toHaveBeenCalledTimes(1);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('keeps the same call site when only EMAIL_PROVIDER changes', async () => {
        Object.assign(process.env, {
            RESEND_API_KEY: 're_test',
            CLOUDFLARE_ACCOUNT_ID: 'acct_1',
            CLOUDFLARE_EMAIL_API_TOKEN: 'cf_token',
            EMAIL_FROM: 'no-reply@pixtooth.com',
        });

        const service = new EmailService();

        process.env.EMAIL_PROVIDER = 'resend';
        const viaResend = await service.sendEmail(deliveryArgs());
        const resendCall = fetchMock.mock.calls[0][0];

        fetchMock.mockClear();
        process.env.EMAIL_PROVIDER = 'cloudflare';
        const viaCloudflare = await service.sendEmail(deliveryArgs());

        expect(viaResend.delivered).toBe(true);
        expect(viaCloudflare.delivered).toBe(true);
        expect(resendCall).toBe('https://api.resend.com/emails');
        expect(fetchMock.mock.calls[0][0]).not.toBe(resendCall);
    });

    it('auto-detects a configured provider when EMAIL_PROVIDER is unset', () => {
        process.env.RESEND_API_KEY = 're_test';
        process.env.EMAIL_FROM = 'no-reply@pixtooth.com';

        expect(selectTransport().transport.name).toBe('resend');
    });

    it('reports an unusable provider instead of guessing', () => {
        process.env.EMAIL_PROVIDER = 'sendgrid';

        const { transport, reason, detail } = selectTransport();
        expect(transport).toBeNull();
        expect(reason).toBe('unknown_provider');
        expect(detail).toContain('EMAIL_PROVIDER="sendgrid"');
    });

    it('names the missing variables when the chosen provider is incomplete', () => {
        process.env.EMAIL_PROVIDER = 'resend';

        const { reason, detail } = selectTransport();
        expect(reason).toBe('missing_credentials');
        expect(detail).toContain('RESEND_API_KEY');
    });
});

describe('delivery failures', () => {
    it('fails loudly but never throws when no provider is configured', async () => {
        const result = await new EmailService().sendEmail(deliveryArgs());

        expect(result).toMatchObject({
            delivered: false,
            provider: 'none',
            reason: 'not_configured',
            template: 'password_reset',
        });

        const failureLog = errorSpy.mock.calls.find(([prefix, payload]) => prefix.includes('delivery_failed'));
        expect(failureLog).toBeTruthy();
        expect(JSON.parse(failureLog[1])).toMatchObject({
            reason: 'not_configured',
            template: 'password_reset',
            userId: 'm-1',
        });
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('email is not usable'));
    });

    it('warns about a missing provider only once per process', async () => {
        const service = new EmailService();

        await service.sendEmail(deliveryArgs());
        await service.sendEmail(deliveryArgs());

        expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('does not leak the email body into logs in production', async () => {
        process.env.NODE_ENV = 'production';

        await new EmailService().sendPasswordResetEmail({
            to: 'doctor@clinic.com',
            resetUrl: 'https://app.pixtooth.com/reset-password?token=abc',
            code: '491233',
            userId: 'm-1',
        });

        const logged = [...logSpy.mock.calls, ...warnSpy.mock.calls].flat().join(' ');
        expect(logged).not.toContain('491233');
    });

    it('turns a provider error into a structured failure', async () => {
        Object.assign(process.env, {
            EMAIL_PROVIDER: 'resend',
            RESEND_API_KEY: 're_test',
            EMAIL_FROM: 'no-reply@pixtooth.com',
        });
        fetchMock.mockResolvedValue({ ok: false, status: 422, json: async () => ({ message: 'domain not verified' }) });

        const result = await new EmailService().sendEmail(deliveryArgs());

        expect(result).toMatchObject({ delivered: false, provider: 'resend', reason: 'provider_error' });
        expect(result.detail).toContain('domain not verified');
    });

    it('treats a permanent bounce as a failure', async () => {
        Object.assign(process.env, {
            EMAIL_PROVIDER: 'cloudflare',
            CLOUDFLARE_ACCOUNT_ID: 'acct_1',
            CLOUDFLARE_EMAIL_API_TOKEN: 'cf_token',
            EMAIL_FROM: 'no-reply@pixtooth.com',
        });
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                success: true,
                errors: [],
                result: { delivered: [], permanent_bounces: ['doctor@clinic.com'], queued: [] },
            }),
        });

        const result = await new EmailService().sendEmail(deliveryArgs());

        expect(result).toMatchObject({ delivered: false, provider: 'cloudflare', reason: 'hard_bounce' });
    });

    it('rejects an empty recipient before calling the provider', async () => {
        Object.assign(process.env, {
            EMAIL_PROVIDER: 'resend',
            RESEND_API_KEY: 're_test',
            EMAIL_FROM: 'no-reply@pixtooth.com',
        });

        const result = await new EmailService().sendEmail({ ...deliveryArgs(), to: null });

        expect(result).toMatchObject({ delivered: false, reason: 'invalid_recipient' });
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('password reset telemetry', () => {
    const buildMedicService = (delivery) => {
        const service = new MedicService();

        service.medicRepository = {
            getMedicByEmail: jest.fn().mockResolvedValue({ id: 'm-1', email: 'doctor@clinic.com' }),
            savePasswordResetState: jest.fn().mockResolvedValue(undefined),
        };
        service.emailService = { sendPasswordResetEmail: jest.fn().mockResolvedValue(delivery) };

        return service;
    };

    it('records a failure against the account and reports it in the result', async () => {
        const service = buildMedicService({
            delivered: false,
            provider: 'none',
            template: 'password_reset',
            reason: 'not_configured',
            detail: 'no email provider configured',
        });

        const result = await service.createPasswordResetRequest('doctor@clinic.com');

        expect(result).toEqual({ accepted: true, emailDelivered: false });
        expect(mockTrackEmailDeliveryFailure).toHaveBeenCalledWith('m-1', expect.objectContaining({
            reason: 'not_configured',
            template: 'password_reset',
        }));
    });

    it('records nothing when the message was accepted by the provider', async () => {
        const service = buildMedicService({ delivered: true, provider: 'resend', template: 'password_reset' });

        const result = await service.createPasswordResetRequest('doctor@clinic.com');

        expect(result).toEqual({ accepted: true, emailDelivered: true });
        expect(mockTrackEmailDeliveryFailure).not.toHaveBeenCalled();
    });

    it('still answers the same way for an unknown email', async () => {
        const service = buildMedicService({ delivered: true, provider: 'resend' });
        service.medicRepository.getMedicByEmail = jest.fn().mockResolvedValue(null);

        await expect(service.createPasswordResetRequest('ghost@clinic.com')).resolves.toEqual({ accepted: true });
        expect(service.emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
});
