#!/usr/bin/env node
/**
 * Builds the single Lambda artifact: the frontend and the API in one directory tree.
 *
 * The tree mirrors the repository (dist/ next to server/), which is what the code
 * already assumes, so nothing inside the function needs a rewritten path.
 *
 * Output: deploy/lambda/build/  (fed to SAM as CodeUri)
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFrontend } from './lib/frontend-build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'deploy', 'lambda', 'build');
const serverOut = path.join(outDir, 'server');

const SERVER_ENTRIES = [
    'app.js',
    'lambda.js',
    'package.json',
    'package-lock.json',
    'src',
    'docs',
];

const run = (command, args, options = {}) => execFileSync(command, args, {
    stdio: 'inherit',
    cwd: root,
    ...options,
});

const directorySize = (target) => {
    let total = 0;

    for (const entry of readdirSync(target, { withFileTypes: true })) {
        const entryPath = path.join(target, entry.name);
        total += entry.isDirectory() ? directorySize(entryPath) : statSync(entryPath).size;
    }

    return total;
};

const megabytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// The frontend is built against its own origin, because the API answers on the same
// hostname in this deployment. 'self' is what src/api/apiClient.js expects for that.
buildFrontend(root);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(serverOut, { recursive: true });

cpSync(path.join(root, 'dist'), path.join(outDir, 'dist'), { recursive: true });

for (const entry of SERVER_ENTRIES) {
    cpSync(path.join(root, 'server', entry), path.join(serverOut, entry), { recursive: true });
}

// Development tooling stays out of the package; the size difference is large.
run('npm', ['ci', '--omit=dev', '--no-audit', '--no-fund'], { cwd: serverOut });

console.log('');
console.log(`artifact:     ${path.relative(root, outDir)}`);
console.log(`frontend:     ${megabytes(directorySize(path.join(outDir, 'dist')))}`);
console.log(`api + deps:   ${megabytes(directorySize(serverOut))}`);
console.log('next:         sam deploy --template-file deploy/lambda/template.yaml ...');
