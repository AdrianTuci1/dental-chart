import { cpSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Copies server/docs into dist/api-docs once the bundle is written.
 *
 * server/app.js serves the OpenAPI page from disk, which a Worker isolate does not have,
 * so on that host it travels with the assets and server/src/http/workerApp.js reads it
 * from /api-docs/. Doing it here rather than in the deploy scripts means every build
 * produces a dist/ that both targets can run, and `vite build` emptying the directory can
 * never leave /docs answering 404.
 */
const copyApiDocs = () => ({
    name: 'pixtooth-api-docs',

    apply: 'build',

    closeBundle() {
        const target = path.join(root, 'dist', 'api-docs');

        rmSync(target, { recursive: true, force: true });
        cpSync(path.join(root, 'server', 'docs'), target, { recursive: true });
    },
});

export default copyApiDocs;
