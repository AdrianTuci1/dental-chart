# CI/CD and Deploy Notes

This repository now has separate validation and deployment flows for frontend and backend.

## What is covered

- Frontend CI: install, run Vitest, build with Vite.
- Backend CI: install, run Jest.
- Frontend deploy: only uploads the already validated `dist/` artifact to Cloudflare Pages.
- Backend deploy: uploads a release folder to the VPS, bootstraps the machine if needed, reloads PM2 in cluster mode, and rolls back to the previous release if the new one fails `/health`.

## Frontend

The workflow is `.github/workflows/deploy-frontend.yml`.

- Cloudflare Pages project: `pixtooth-app`
- Expected production domain: `app.pixtooth.com`
- API origin secret: `VITE_API_URL`

Important:

- The workflow deploys the frontend bundle.
- The custom domain `app.pixtooth.com` must still be attached once in the Cloudflare Pages project settings.
- If the frontend CI or build fails, Cloudflare does not receive a new production bundle, so the previous working frontend stays live.

## Backend

The workflow is `.github/workflows/deploy-backend.yml`.

Default production settings:

- deploy root: `/root/pixtooth-backend`
- PM2 app name: `pixtooth-backend`
- bind host: `127.0.0.1`
- bind port: `3100`
- public API domain: `api.pixtooth.com`

The deploy flow is:

1. Run backend tests in GitHub Actions.
2. Upload the backend into `incoming/<release-id>` on the VPS.
3. Run `server/scripts/bootstrap-vps.sh`.
4. Run `server/scripts/deploy-release.sh`.
5. Switch `current` to the new release.
6. `pm2 startOrReload` the cluster.
7. Verify `http://127.0.0.1:3100/health`.
8. If the health check fails, restore the previous release and reload PM2 again.

Because the live release is only switched at the end, a failed deploy no longer overwrites the currently working backend in place.

## Empty VPS bootstrap

`server/scripts/bootstrap-vps.sh` is intended for Debian/Ubuntu-style VPS machines and is idempotent.

It ensures:

- Node.js 22 is installed if missing.
- `nginx`, `curl`, `rsync`, `ca-certificates`, and `gnupg` exist.
- `pm2` is installed globally.
- the deploy folders exist under the configured deploy root.
- a shared `.env` file exists.
- the Nginx site for `api.pixtooth.com` proxies to `127.0.0.1:3100`.

The Nginx template used by the script is:

- `server/deploy/nginx/api.pixtooth.com.conf`

## Required GitHub secrets

- `VPS_IP`
- `VPS_USER`
- `VPS_SSH_KEY`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `VITE_API_URL`

## Optional GitHub repository variables

- `DEPLOY_ROOT`
- `BACKEND_PORT`
- `BACKEND_HOST`
- `API_DOMAIN`

If those variables are not set, the defaults above are used.
