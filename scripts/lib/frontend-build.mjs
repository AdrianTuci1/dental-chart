import { execFileSync } from 'node:child_process';

/**
 * Builds the SPA for a host that answers the API itself.
 *
 * VITE_API_URL=self is what src/api/apiClient.js reads as "same origin". Both
 * serverless targets put the frontend and the API behind one hostname, and a baked in
 * https://api... origin would send the browser back to the VPS that is being retired.
 *
 * The OpenAPI page lands in dist/api-docs through scripts/vite-plugin-api-docs.js, so the
 * output of any `npm run build` is complete for either host.
 *
 * extraEnv reaches Vite as environment variables. Vite folds every VITE_-prefixed name in
 * process.env into import.meta.env, which is how a caller passes a value that only lives
 * in .env.deploy.
 */
export const buildFrontend = (root, extraEnv = {}) => {
    execFileSync('npm', ['run', 'build'], {
        stdio: 'inherit',
        cwd: root,
        env: { ...process.env, VITE_API_URL: 'self', ...extraEnv },
    });
};
