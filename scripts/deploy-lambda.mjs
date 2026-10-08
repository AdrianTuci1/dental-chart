#!/usr/bin/env node
/**
 * Deploys Pixtooth as one Lambda artifact.
 *
 * scripts/build-lambda-artifact.mjs puts dist/ next to server/ in deploy/lambda/build/,
 * which is exactly the layout the code already expects, so one package carries the
 * frontend and the API. deploy/lambda/template.yaml wraps it in a function behind an API
 * Gateway HTTP API with a custom domain. There is no EC2 instance, no Nginx and no PM2.
 *
 * Usage:
 *   npm run deploy:lambda
 *   npm run deploy:lambda -- --dry-run            build and validate, ship nothing
 *   npm run deploy:lambda -- --yes                skip the changeset review prompt
 *   npm run deploy:lambda -- --generate-secrets   create JWT secrets missing from .env.deploy
 *   npm run deploy:lambda -- --no-build           reuse deploy/lambda/build/
 *
 * Values come from .env.deploy; see .env.deploy.example for the full list. This script
 * generates the file from .env.deploy.example when it does not exist yet.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { appendEnvFile, readEnvFile } from './lib/env-file.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(root, '.env.deploy');
const templateFile = path.join('deploy', 'lambda', 'template.yaml');

/** Parameters the template has no default for, or that a deploy must never guess. */
const REQUIRED = [
    'API_DOMAIN',
    'API_CERTIFICATE_ARN',
    'DYNAMODB_TABLE_NAME',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
];

/** .env.deploy name -> CloudFormation parameter name. Anything else keeps ENABLE_TELEMETRY=false. */
const PARAMETERS = {
    API_DOMAIN: 'ApiDomainName',
    API_CERTIFICATE_ARN: 'ApiCertificateArn',
    DYNAMODB_TABLE_NAME: 'DynamoTableName',
    JWT_SECRET: 'JwtSecret',
    REFRESH_TOKEN_SECRET: 'RefreshTokenSecret',
    CORS_ORIGIN: 'CorsOrigin',
    GOOGLE_CLIENT_ID: 'GoogleClientId',
    EMAIL_PROVIDER: 'EmailProvider',
    EMAIL_FROM: 'EmailFrom',
    RESEND_API_KEY: 'ResendApiKey',
    CLOUDFLARE_ACCOUNT_ID: 'CloudflareAccountId',
    CLOUDFLARE_EMAIL_API_TOKEN: 'CloudflareEmailApiToken',
    PASSWORD_RESET_URL: 'PasswordResetUrl',
    TELEMETRY_EXPORT_SECRET: 'TelemetryExportSecret',
    MODAL_INFERENCE_URL: 'ModalInferenceUrl',
    AI_ANALYSIS_ENABLED: 'AiAnalysisEnabled',
    ENABLE_TELEMETRY: 'EnableTelemetry',
    STAGE: 'Stage',
};

const GENERATED_SECRETS = ['JWT_SECRET', 'REFRESH_TOKEN_SECRET'];

const parseArgs = (argv) => {
    const options = { dryRun: false, yes: false, build: true, generateSecrets: false };

    for (const arg of argv) {
        if (arg === '--dry-run') options.dryRun = true;
        else if (arg === '--yes' || arg === '-y') options.yes = true;
        else if (arg === '--no-build') options.build = false;
        else if (arg === '--generate-secrets') options.generateSecrets = true;
        else if (arg === '--help' || arg === '-h') options.help = true;
        else throw new Error(`Unknown option: ${arg}`);
    }

    return options;
};

const run = (command, args, options = {}) => execFileSync(command, args, {
    stdio: 'inherit',
    cwd: root,
    ...options,
});

const ensureSam = () => {
    try {
        execFileSync('sam', ['--version'], { stdio: 'ignore' });
    } catch {
        throw new Error(
            'The AWS SAM CLI is not on PATH. Install it with "brew install aws-sam-cli", '
            + 'or follow https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html',
        );
    }
};

/**
 * Creates the two signing secrets once and writes them back, so later deploys reuse the
 * same values. Regenerating them on every deploy would end every open session.
 */
const generateSecrets = (values) => {
    const missing = GENERATED_SECRETS.filter((name) => !values[name]);

    if (!missing.length) {
        console.log('Both signing secrets are already in .env.deploy.');
        return values;
    }

    const generated = Object.fromEntries(missing.map((name) => [name, randomBytes(32).toString('hex')]));

    appendEnvFile(envFile, generated);
    console.log(`Generated and saved to .env.deploy: ${missing.join(', ')}`);

    return { ...values, ...generated };
};

const buildParameterOverrides = (values) => Object.entries(PARAMETERS)
    .filter(([name]) => values[name])
    .map(([name, parameter]) => `${parameter}=${values[name]}`);

const main = () => {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        const header = readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0];
        console.log(header.replace(/^#!.*\n/, '').replace(/^\/\*\*\n/, '').replace(/^ \* ?/gm, ''));
        return;
    }

    if (!existsSync(envFile)) {
        copyFileSync(path.join(root, '.env.deploy.example'), envFile);
        console.log('Created .env.deploy from .env.deploy.example. Fill in the AWS values and rerun.');
        return;
    }

    let values = readEnvFile(envFile);

    if (options.generateSecrets) {
        values = generateSecrets(values);
    }

    const missing = REQUIRED.filter((name) => !values[name]);

    if (missing.length) {
        const generatable = missing.filter((name) => GENERATED_SECRETS.includes(name));
        const manual = missing.filter((name) => !GENERATED_SECRETS.includes(name));
        const next = [];

        if (manual.length) next.push(`fill in ${manual.join(', ')} in .env.deploy`);
        if (generatable.length) next.push(`run with --generate-secrets for ${generatable.join(', ')}`);

        throw new Error(`.env.deploy is missing: ${missing.join(', ')}\nThen ${next.join(', and ')}.`);
    }

    const region = values.AWS_REGION || 'eu-central-1';
    const stackName = values.STACK_NAME || 'pixtooth';
    const artifactsBucket = values.ARTIFACTS_BUCKET;

    if (!artifactsBucket && !options.dryRun) {
        throw new Error(
            'ARTIFACTS_BUCKET is missing from .env.deploy. SAM uploads the ~26 MB artifact through S3, '
            + 'so it needs a bucket in the same region.',
        );
    }

    ensureSam();

    console.log('Deploying Pixtooth to AWS Lambda');
    console.log(`  stack:  ${stackName}`);
    console.log(`  region: ${region}`);
    console.log(`  domain: ${values.API_DOMAIN}`);
    if (artifactsBucket) console.log(`  bucket: ${artifactsBucket}`);
    console.log(options.dryRun ? '  mode:   dry run' : '');
    console.log('');

    if (options.build) {
        console.log('Building the artifact...');
        run('node', ['scripts/build-lambda-artifact.mjs']);
    } else {
        console.log('Skipping the build (--no-build).');
    }

    const parameterOverrides = buildParameterOverrides(values);

    if (options.dryRun) {
        console.log('');
        console.log('Validating the template...');
        run('sam', ['validate', '--template-file', templateFile, '--region', region]);

        console.log('');
        console.log('Parameter overrides that a real deploy would send:');
        for (const entry of parameterOverrides) {
            const [parameter] = entry.split('=');
            console.log(`  ${parameter}`);
        }

        console.log('');
        console.log('Dry run finished; nothing was uploaded.');
        return;
    }

    console.log('');
    console.log('Deploying the stack...');

    const args = [
        'deploy',
        '--template-file', templateFile,
        '--stack-name', stackName,
        '--region', region,
        '--s3-bucket', artifactsBucket,
        '--capabilities', 'CAPABILITY_IAM',
        '--parameter-overrides', ...parameterOverrides,
        '--no-fail-on-empty-changeset',
    ];

    if (options.yes) {
        args.push('--no-confirm-changeset');
    }

    run('sam', args);

    console.log('');
    console.log('Reading stack outputs...');
    run('sam', ['list-stack-outputs', '--stack-name', stackName, '--region', region]);

    console.log('');
    console.log(`Point the API hostname at the CustomDomainTarget CNAME above, with the Cloudflare proxy on.`);
};

try {
    main();
} catch (error) {
    console.error('');
    console.error(`Deploy failed: ${error.message}`);
    process.exit(1);
}
