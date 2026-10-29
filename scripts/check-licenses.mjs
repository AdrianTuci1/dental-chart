#!/usr/bin/env node
/**
 * Fails when a production dependency uses a license outside the allowlist.
 *
 * Development tooling is excluded on purpose: build-only packages such as
 * lightningcss (MPL-2.0) and sharp's libvips (LGPL-3.0) never reach the deployed
 * artifact. Run `npm ls <package> --all` before moving a dependency into
 * `dependencies` or the bundle.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_APPS = ['apps/backend', 'apps/frontend'];
const requestedApps = process.argv.slice(2);
const APPS = requestedApps.length ? requestedApps : DEFAULT_APPS;

const ALLOWED = new Set([
    '0BSD',
    'Apache-2.0',
    'Apache-2.0 WITH LLVM-exception',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'BlueOak-1.0.0',
    'CC0-1.0',
    'ISC',
    'MIT',
    'MIT-0',
    'Public Domain',
    'Python-2.0',
    'Unlicense',
]);

const alternatives = (license) => {
    if (!license) return [];
    if (Array.isArray(license)) return license.flatMap(alternatives);
    if (typeof license === 'object') return alternatives(license.type);

    return String(license)
        .replace(/[()]/g, ' ')
        .split(/\s+OR\s+/i)
        .map((entry) => entry.trim())
        .filter(Boolean);
};

const isAllowed = (license) => {
    const options = alternatives(license);

    return options.length > 0 && options.some((option) => ALLOWED.has(option));
};

const productionPackagePaths = (app) => {
    const output = execFileSync('npm', ['ls', '--omit=dev', '--all', '--parseable'], {
        cwd: path.join(root, app),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
    });

    return output
        .split('\n')
        .filter(Boolean)
        .slice(1);
};

let checked = 0;
const failures = [];
const seen = new Set();

for (const app of APPS) {
    for (const packagePath of productionPackagePaths(app)) {
        let packageJsonPath;

        try {
            packageJsonPath = path.join(realpathSync(packagePath), 'package.json');
        } catch {
            continue;
        }

        if (seen.has(packageJsonPath)) continue;
        seen.add(packageJsonPath);

        const manifest = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        const license = manifest.license || manifest.licenses;
        checked += 1;

        if (!isAllowed(license)) {
            failures.push({
                app,
                name: manifest.name,
                version: manifest.version,
                license: license ? JSON.stringify(license) : 'missing',
            });
        }
    }
}

if (failures.length) {
    console.error('Disallowed production dependency licenses:');

    for (const failure of failures) {
        console.error(`  ${failure.name}@${failure.version} (${failure.app}): ${failure.license}`);
    }

    console.error('');
    console.error('Move build-only packages to devDependencies, replace the package,');
    console.error('or update the allowlist in scripts/check-licenses.mjs after review.');
    process.exit(1);
}

console.log(`license check: ${checked} production packages, all permissive`);
