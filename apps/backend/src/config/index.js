const { selectTransport, TRANSPORTS } = require('../modules/email/infrastructure/providers');

const DRIVERS = ['dynamo', 'postgres'];
const DEFAULT_TABLE = 'DentalChart';

class ConfigurationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConfigurationError';
    }
}

const isWorkerRuntime = () => globalThis.navigator?.userAgent === 'Cloudflare-Workers';
const isLambdaRuntime = (env) => Boolean(env.AWS_LAMBDA_FUNCTION_NAME || env.LAMBDA_TASK_ROOT);

const splitList = (value) => (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const parseDriver = (value, env) => {
    const driver = (value || 'dynamo').trim().toLowerCase();

    if (!DRIVERS.includes(driver)) {
        throw new ConfigurationError(`DB_DRIVER must be one of: ${DRIVERS.join(', ')} (received "${value}")`);
    }

    // Serverless hosts cannot keep a connection pool: Lambda opens one per execution
    // environment and the Worker has no TCP sockets. Postgres is a long-running host
    // option, so the unsupported host fails here instead of exhausting connections later.
    if (driver === 'postgres' && (isWorkerRuntime() || isLambdaRuntime(env))) {
        throw new ConfigurationError(
            'DB_DRIVER=postgres requires a long-running Node host (VPS, Docker, Kubernetes); '
            + 'AWS Lambda and Cloudflare Workers use DynamoDB'
        );
    }

    return driver;
};

const parsePositiveInt = (value, fallback, name) => {
    if (value === undefined || value === null || String(value).trim() === '') {
        return fallback;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new ConfigurationError(`${name} must be a positive integer (received "${value}")`);
    }

    return parsed;
};

const parsePostgres = (env) => ({
    connectionString: env.DATABASE_URL || '',
    ssl: env.DATABASE_SSL === 'true',
    schema: env.DATABASE_SCHEMA || 'public',
    autoMigrate: env.DATABASE_AUTO_MIGRATE !== 'false',
    pool: {
        max: parsePositiveInt(env.DATABASE_POOL_MAX, 10, 'DATABASE_POOL_MAX'),
        idleTimeoutMillis: parsePositiveInt(
            env.DATABASE_POOL_IDLE_TIMEOUT_MS,
            10000,
            'DATABASE_POOL_IDLE_TIMEOUT_MS'
        ),
        connectionTimeoutMillis: parsePositiveInt(
            env.DATABASE_POOL_CONNECTION_TIMEOUT_MS,
            10000,
            'DATABASE_POOL_CONNECTION_TIMEOUT_MS'
        ),
    },
});

/**
 * One description of everything the deployment can configure. Modules keep reading the
 * variables they need; this object is the single place that answers "what is this host
 * running on, and what is still missing?" for logs, `/health` and the settings screen.
 */
const loadConfig = (env = process.env) => {
    const driver = parseDriver(env.DB_DRIVER, env);
    const email = selectTransport(env);
    const postgres = parsePostgres(env);

    if (driver === 'postgres' && !postgres.connectionString) {
        throw new ConfigurationError('DB_DRIVER=postgres requires DATABASE_URL');
    }

    return {
        environment: env.NODE_ENV || 'development',
        database: {
            driver,
            tableName: env.DYNAMODB_TABLE_NAME || env.DYNAMODB_TABLE || DEFAULT_TABLE,
            postgres,
            dynamoRegion: env.AWS_REGION || 'eu-central-1',
        },
        email: {
            requestedProvider: (env.EMAIL_PROVIDER || '').trim().toLowerCase() || null,
            provider: email.transport?.name || 'none',
            configured: Boolean(email.transport),
            reason: email.reason || null,
            detail: email.detail || null,
            from: env.EMAIL_FROM || null,
            resetUrlConfigured: Boolean(env.PASSWORD_RESET_URL),
        },
        google: {
            configured: Boolean(env.GOOGLE_CLIENT_ID),
        },
        ai: {
            enabled: env.AI_ANALYSIS_ENABLED === 'true',
            inferenceConfigured: Boolean(env.MODAL_INFERENCE_URL),
        },
        auth: {
            jwtSecretConfigured: Boolean(env.JWT_SECRET),
            refreshTokenSecretConfigured: Boolean(env.REFRESH_TOKEN_SECRET),
            accessTokenLifetime: env.JWT_EXPIRES_IN || '15m',
            refreshTokenLifetime: env.REFRESH_TOKEN_EXPIRES_IN || '365d',
        },
        corsOrigins: splitList(env.CORS_ORIGIN),
    };
};

const describePostgresTarget = (connectionString, forceSsl = false) => {
    if (!connectionString) {
        return { configured: false };
    }

    try {
        const url = new URL(connectionString);

        return {
            configured: true,
            host: url.hostname || null,
            database: url.pathname ? url.pathname.replace(/^\//, '') : null,
            ssl: forceSsl || /[?&]sslmode=require/.test(connectionString),
        };
    } catch {
        return { configured: true, host: null, database: null, invalid: true };
    }
};

const emailHint = (config, env) => {
    if (config.email.configured) {
        return null;
    }

    const requested = config.email.requestedProvider;
    const transport = requested ? TRANSPORTS[requested] : null;

    if (requested && transport) {
        const missing = transport.missingConfig(env);
        if (missing.length) {
            return `EMAIL_PROVIDER="${requested}" is missing ${missing.join(', ')}`;
        }
    }

    return config.email.detail || 'no email provider configured';
};

const collectWarnings = (config, env) => {
    const warnings = [];
    const emailWarning = emailHint(config, env);

    if (emailWarning) warnings.push(emailWarning);
    if (!config.auth.jwtSecretConfigured) warnings.push('JWT_SECRET is not set; the development fallback is in use');
    if (!config.auth.refreshTokenSecretConfigured) warnings.push('REFRESH_TOKEN_SECRET is not set; the development fallback is in use');
    if (!config.google.configured) warnings.push('GOOGLE_CLIENT_ID is not set; Google sign-in is hidden');

    if (config.ai.enabled && !config.ai.inferenceConfigured) {
        warnings.push('AI_ANALYSIS_ENABLED=true but MODAL_INFERENCE_URL is not set');
    }

    if (config.database.driver === 'postgres') {
        const target = describePostgresTarget(config.database.postgres.connectionString);

        if (target.invalid) warnings.push('DATABASE_URL is not a valid connection URL');
    } else if (!env.DYNAMODB_TABLE_NAME && !env.DYNAMODB_TABLE && env.NODE_ENV === 'production') {
        warnings.push(`DYNAMODB_TABLE_NAME is not set; using "${DEFAULT_TABLE}"`);
    }

    return warnings;
};

/**
 * The safe subset returned to the settings screen: providers, drivers and which
 * variables are present. Values and secrets never leave the server.
 */
const describeConfig = (config = loadConfig(), env = process.env) => {
    const postgresTarget = describePostgresTarget(
        config.database.postgres.connectionString,
        config.database.postgres.ssl
    );

    return {
        runtime: {
            environment: config.environment,
            corsOrigins: config.corsOrigins,
        },
        database: {
            driver: config.database.driver,
            tableName: config.database.tableName,
            region: config.database.driver === 'dynamo' ? config.database.dynamoRegion : null,
            target: config.database.driver === 'postgres'
                ? { ...postgresTarget, poolMax: config.database.postgres.pool.max }
                : { configured: true, table: config.database.tableName },
        },
        email: {
            configured: config.email.configured,
            provider: config.email.provider,
            requestedProvider: config.email.requestedProvider,
            from: config.email.from,
            reason: config.email.reason,
            detail: config.email.detail,
        },
        google: { configured: config.google.configured },
        ai: config.ai,
        auth: config.auth,
        warnings: collectWarnings(config, env),
    };
};

module.exports = {
    DRIVERS,
    ConfigurationError,
    loadConfig,
    describeConfig,
};
