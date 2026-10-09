#!/usr/bin/env node
/**
 * Deploys Pixtooth to Cloudflare Workers.
 *
 * One Worker carries both halves: the built frontend arrives through the ASSETS
 * binding in worker/wrangler.toml, and the API runs on worker/index.js through the same
 * route table the Express host uses. Nothing is uploaded to the browser except what the
 * assets binding exposes, so the API code and every secret stay on the Worker.
 *
 * Usage:
 *   npm run deploy:worker
 *   npm run deploy:worker -- --dry-run          bundle and report, upload nothing
 *   npm run deploy:worker -- --sync-secrets     push the secrets found in .env.deploy
 *   npm run deploy:worker -- --no-build         reuse the existing dist/
 *
 * Secrets come from .env.deploy and are pushed to the Worker; WORKER_DOMAIN from the same
 * file attaches the public hostname. Cloudflare credentials come from the shell: either a
 * previous `wrangler login` or CLOUDFLARE_API_TOKEN plus CLOUDFLARE_ACCOUNT_ID.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { buildFrontend } from './lib/frontend-build.mjs';
import { readEnvFile } from './lib/env-file.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Wrangler resolves dependencies with the `browser` condition, and several AWS SDK
 * subpaths answer that condition with a build whose Node-only helpers are
 * `Symbol.for("node-only")` sentinels. The SDK calls those helpers anyway, so the
 * client throws on construction. Asking for the Node builds fixes every affected
 * subpath at once, and it has to be both variables: the platform drops the implicit
 * `browser` condition, the list keeps it from being added back.
 */
const BUILD_ENV = {
    WRANGLER_BUILD_PLATFORM: 'node',
    WRANGLER_BUILD_CONDITIONS: 'workerd,worker,node',
};

// Everything outside [vars] in worker/wrangler.toml is a secret, so this is the set the
// Worker needs from .env.deploy.
const SECRET_NAMES = [
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'DYNAMODB_TABLE_NAME',
    'AWS_REGION',
    'AWS_ACCOUNT_ID',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_SESSION_TOKEN',
    'CORS_ORIGIN',
    'GOOGLE_CLIENT_ID',
    'PASSWORD_RESET_URL',
    'EMAIL_PROVIDER',
    'EMAIL_FROM',
    'RESEND_API_KEY',
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_EMAIL_API_TOKEN',
    'GMAIL_USER',
    'GMAIL_APP_PASSWORD',
    'GMAIL_FROM_EMAIL',
    'MODAL_INFERENCE_URL',
    'AI_ANALYSIS_ENABLED',
    'ENABLE_TELEMETRY',
    'TELEMETRY_EXPORT_SECRET',
];

// A Worker without these fails on the first request that needs data or a session.
const REQUIRED_NAMES = [
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'DYNAMODB_TABLE_NAME',
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
];

const parseArgs = (argv) => {
    const options = { dryRun: false, syncSecrets: false, build: true, config: 'worker/wrangler.toml' };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === '--dry-run') options.dryRun = true;
        else if (arg === '--sync-secrets') options.syncSecrets = true;
        else if (arg === '--no-build') options.build = false;
        else if (arg === '--config') options.config = argv[++index];
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

const wrangler = (args, options = {}) => run('npx', ['wrangler', ...args], options);

/** Reads the secret names already stored on the Worker, or null when that cannot be checked. */
const listSecretNames = (config) => {
    try {
        const output = execFileSync('npx', ['wrangler', 'secret', 'list', '-c', config], {
            cwd: root,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        });

        const start = output.indexOf('[');
        const end = output.lastIndexOf(']');

        if (start === -1 || end === -1) return null;

        return new Set(JSON.parse(output.slice(start, end + 1)).map((entry) => entry.name));
    } catch {
        // Not logged in, or no access to the account. The deploy below will say so.
        return null;
    }
};

const pushSecrets = (config, values) => {
    const present = SECRET_NAMES.filter((name) => values[name]);

    if (!present.length) {
        console.log('No secrets found in .env.deploy; nothing to upload.');
        return;
    }

    console.log(`Uploading ${present.length} secret(s) to the Worker...`);

    for (const name of present) {
        wrangler(['secret', 'put', name, '-c', config], {
            stdio: ['pipe', 'inherit', 'inherit'],
            input: `${values[name]}\n`,
        });
    }
};

const checkSecrets = (config, values) => {
    const stored = listSecretNames(config);

    if (stored === null) {
        console.log('Could not read the secret list; skipping the check.');
        return;
    }

    const missing = REQUIRED_NAMES.filter((name) => !stored.has(name));

    if (!missing.length) {
        console.log('All required secrets are present on the Worker.');
        return;
    }

    console.log('');
    console.log(`Warning: the Worker is missing ${missing.join(', ')}.`);

    for (const name of missing) {
        const hint = values[name] ? '  (present in .env.deploy; rerun with --sync-secrets)' : '';
        console.log(`  npx wrangler secret put ${name} -c ${config}${hint}`);
    }

    console.log('');
};

// async so that a throw inside becomes a rejection the handler below can catch; without
// it a failure would escape before .catch() is attached.
const main = async () => {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        const header = readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0];
        console.log(header.replace(/^#!.*\n/, '').replace(/^\/\*\*\n/, '').replace(/^ \* ?/gm, ''));
        return;
    }

    const envFile = path.join(root, '.env.deploy');
    const fileValues = readEnvFile(envFile);

    const domain = fileValues.WORKER_DOMAIN || process.env.WORKER_DOMAIN;

    console.log('Deploying Pixtooth to Cloudflare Workers');
    console.log(`  config: ${options.config}`);
    console.log(`  domain: ${domain || '(workers.dev only)'}`);
    console.log(`  env:    ${Object.keys(fileValues).length ? '.env.deploy' : '(shell only)'}${options.dryRun ? ' [dry run]' : ''}`);
    console.log('');

    if (options.syncSecrets) {
        pushSecrets(options.config, fileValues);
    } else {
        checkSecrets(options.config, fileValues);
    }

    if (options.build) {
        console.log('Building the frontend...');

        // The Google client id is baked into the bundle at build time, so Vite needs it
        // under its own name. .env.deploy keeps it as GOOGLE_CLIENT_ID, which is what the
        // server reads, so the same value feeds both halves.
        const googleClientId = fileValues.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;

        buildFrontend(root, googleClientId ? { VITE_GOOGLE_CLIENT_ID: googleClientId } : {});
    } else {
        console.log('Skipping the build (--no-build).');
    }

    console.log('');
    console.log('Uploading the Worker...');

    // An absolute --outdir: wrangler resolves a relative one against two different
    // directories and ends up writing the bundle somewhere other than the README.
    const outDir = path.join(root, 'deploy', 'worker', 'build');

    wrangler(
        [
            'deploy',
            '-c', options.config,
            ...(domain ? ['--domain', domain] : []),
            ...(options.dryRun ? ['--dry-run', '--outdir', outDir] : []),
        ],
        // .env.deploy reaches wrangler as environment variables too, so a
        // CLOUDFLARE_ACCOUNT_ID kept there is picked up. It does not configure the
        // deployed Worker: that is what --sync-secrets and wrangler.toml are for.
        { env: { ...process.env, ...fileValues, ...BUILD_ENV } },
    );

    console.log('');

    if (options.dryRun) {
        console.log('Dry run finished; nothing was uploaded.');
        console.log(`Bundle for inspection: ${path.relative(root, outDir)}/index.js`);
        return;
    }

    console.log('Done.');
};

main().catch((error) => {
    console.error('');
    console.error(`Deploy failed: ${error.message}`);
    process.exit(1);
});
