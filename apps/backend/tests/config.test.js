const { ConfigurationError, loadConfig, describeConfig } = require('../src/config');

const cleanEnv = (overrides = {}) => ({
    NODE_ENV: 'test',
    DB_DRIVER: 'dynamo',
    JWT_SECRET: 'jwt-secret',
    REFRESH_TOKEN_SECRET: 'refresh-secret',
    DYNAMODB_TABLE_NAME: 'DentalChart',
    ...overrides,
});

describe('runtime configuration', () => {
    it('defaults to DynamoDB', () => {
        const config = loadConfig(cleanEnv({ DB_DRIVER: undefined }));

        expect(config.database.driver).toBe('dynamo');
        expect(config.database.tableName).toBe('DentalChart');
    });

    it('accepts Postgres when a connection string is present', () => {
        const config = loadConfig(cleanEnv({
            DB_DRIVER: 'postgres',
            DATABASE_URL: 'postgres://user:secret@db.internal:5432/pixtooth',
        }));

        expect(config.database.driver).toBe('postgres');
        expect(config.database.postgres.connectionString).toContain('db.internal');
    });

    it('refuses an unknown driver instead of silently falling back', () => {
        expect(() => loadConfig(cleanEnv({ DB_DRIVER: 'mysql' })))
            .toThrow(ConfigurationError);
    });

    it('requires DATABASE_URL for Postgres', () => {
        expect(() => loadConfig(cleanEnv({ DB_DRIVER: 'postgres' })))
            .toThrow(/DATABASE_URL/);
    });

    it('refuses Postgres on the Lambda host', () => {
        expect(() => loadConfig(cleanEnv({
            DB_DRIVER: 'postgres',
            DATABASE_URL: 'postgres://user:secret@db.internal:5432/pixtooth',
            AWS_LAMBDA_FUNCTION_NAME: 'pixtooth-api',
        }))).toThrow(/long-running Node host/);
    });

    it('sizes the pool from the environment and exposes only its maximum', () => {
        const env = cleanEnv({
            DB_DRIVER: 'postgres',
            DATABASE_URL: 'postgres://user:secret@db.internal:5432/pixtooth',
            DATABASE_POOL_MAX: '4',
            DATABASE_POOL_IDLE_TIMEOUT_MS: '5000',
            DATABASE_POOL_CONNECTION_TIMEOUT_MS: '3000',
        });
        const config = loadConfig(env);
        const description = describeConfig(config, env);

        expect(config.database.postgres.pool).toEqual({
            max: 4,
            idleTimeoutMillis: 5000,
            connectionTimeoutMillis: 3000,
        });
        expect(description.database.target.poolMax).toBe(4);
    });

    it('refuses a pool size that is not a positive integer', () => {
        expect(() => loadConfig(cleanEnv({ DATABASE_POOL_MAX: '0' })))
            .toThrow(/DATABASE_POOL_MAX/);
        expect(() => loadConfig(cleanEnv({ DATABASE_POOL_IDLE_TIMEOUT_MS: 'soon' })))
            .toThrow(/DATABASE_POOL_IDLE_TIMEOUT_MS/);
    });

    it('describes the safe configuration without leaking credentials', () => {
        const env = cleanEnv({
            DB_DRIVER: 'postgres',
            DATABASE_URL: 'postgres://user:secret@db.internal:5432/pixtooth',
        });
        const description = describeConfig(loadConfig(env), env);

        expect(description.database).toMatchObject({
            driver: 'postgres',
            target: { host: 'db.internal', database: 'pixtooth', configured: true },
        });
        expect(JSON.stringify(description)).not.toContain('secret');
        expect(description.auth).toMatchObject({
            jwtSecretConfigured: true,
            refreshTokenSecretConfigured: true,
        });
    });

    it('reports email as inactive when no provider is configured', () => {
        const env = cleanEnv({ EMAIL_PROVIDER: 'resend' });
        const description = describeConfig(loadConfig(env), env);

        expect(description.email.configured).toBe(false);
        expect(description.email.provider).toBe('none');
        expect(description.warnings.join(' ')).toContain('RESEND_API_KEY');
    });

    it('reports that platform administrators exist without leaking their addresses', () => {
        const env = cleanEnv({
            PLATFORM_ADMIN_EMAILS: 'Admin@Clinic.test, ops@clinic.test',
        });
        const description = describeConfig(loadConfig(env), env);

        expect(description.admin).toEqual({ configured: true, accounts: 2 });
        expect(JSON.stringify(description)).not.toContain('clinic.test');
    });

    it('reports Stripe as configured without exposing its secrets', () => {
        const env = cleanEnv({
            STRIPE_SECRET_KEY: 'sk_test_do_not_leak',
            STRIPE_WEBHOOK_SECRET: 'whsec_do_not_leak',
            STRIPE_PRICE_MONTHLY: 'price_month',
            STRIPE_PRICE_YEARLY: 'price_year',
        });
        const description = describeConfig(loadConfig(env), env);

        expect(description.billing).toEqual({
            configured: true,
            provider: 'stripe',
            prices: { month: 30, year: 300 },
            currency: 'usd',
        });
        expect(JSON.stringify(description)).not.toContain('sk_test_do_not_leak');
        expect(JSON.stringify(description)).not.toContain('whsec_do_not_leak');
        expect(JSON.stringify(description)).not.toContain('price_month');
    });

    it('reports the configured Google and email state', () => {
        const env = cleanEnv({
            GOOGLE_CLIENT_ID: 'client.apps.googleusercontent.com',
            EMAIL_PROVIDER: 'resend',
            RESEND_API_KEY: 're_test',
            EMAIL_FROM: 'Pixtooth <no-reply@pixtooth.com>',
        });
        const description = describeConfig(loadConfig(env), env);

        expect(description.google.configured).toBe(true);
        expect(description.email).toMatchObject({
            configured: true,
            provider: 'resend',
        });
    });
});
