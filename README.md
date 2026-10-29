# 🦷 Pixtooth — digital dental chart

Pixtooth is a web application for dental practices: patient records, treatment planning
and an interactive 3-plane tooth chart built on **ISO 3950** numbering. The chart is a
projection of the completed history and the treatment plan, so the drawing and the
clinical record stay in sync.

It runs as one self-hosted stack with PostgreSQL, or on AWS Lambda and Cloudflare Workers
with DynamoDB. A separate admin app manages the accounts created in the deployment.

![Chart overview](./apps/frontend/public/static/app-chart.png)

## Key features

- **Patient records** — searchable patient list, chronological history and treatment
  plans, with per-patient medical notes and reports.
- **3-plane tooth chart** — frontal, occlusal and lingual views for every tooth, with
  endodontic, periodontal, pathology and restoration details.
- **Treatment planning on the chart** — planned work is drawn next to completed work, so
  the next visit is visible before it happens.
- **Clinical views** — overview, quick select, periodontal probing, pathology and
  restoration, plus BPE and oral-health metrics.
- **Panoramic X-ray analysis** — a Modal endpoint segments every tooth and classifies its
  status. When the endpoint is unavailable, the API serves a static fallback.
- **Team workspaces** — clinics with owner, admin and member roles, invitations and
  ownership transfer.
- **Account administration** — a separate admin app lists every account and can disable,
  re-enable or delete it.
- **Sessions and access** — password login, Google sign-in, sliding refresh sessions,
  account API keys and password recovery.
- **Configurable storage** — DynamoDB for serverless, PostgreSQL for self-hosted
  deployments, selected with `DB_DRIVER`.
- **Licensing** — one Stripe license at $30/month or $300/year. Buyers get unlimited
  patients in their personal workspace, and the workspaces they own have no cap for
  their members. A member's own personal workspace stays at 5 patients unless that
  member holds the license too.
- **Visible configuration** — Settings → System status reports the database, email,
  Google, AI, billing and auth state, and can send a test email.

## Screenshots

| Clinic app | Admin app |
| --- | --- |
| ![Tooth chart](./apps/frontend/public/static/app-chart.png) | ![Account administration](./docs/screenshots/admin-accounts.png) |

The admin app is responsive: on narrow screens the account table becomes a list of cards.

| Mobile admin |
| --- |
| ![Admin on a phone](./docs/screenshots/admin-mobile.png) |

## Integrations

| Integration | What it adds | Configuration |
| --- | --- | --- |
| Google Identity Services | "Continue with Google" sign-in | `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID` |
| Resend | Welcome, invitation and password-reset email | `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM` |
| Cloudflare Email | The same email templates through Cloudflare | `EMAIL_PROVIDER=cloudflare`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_API_TOKEN`, `EMAIL_FROM` |
| Gmail API | The same email templates through a Google account | `EMAIL_PROVIDER=gmail`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_USER` |
| Modal | X-ray segmentation and tooth-status classification | `MODAL_INFERENCE_URL`, `AI_ANALYSIS_ENABLED=true` |
| Stripe | Checkout, billing portal and subscription webhooks for the license | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` |
| DynamoDB | Default document store for Lambda and the Worker | `AWS_REGION`, `DYNAMODB_TABLE_NAME` |
| PostgreSQL | Document store for VPS, Docker and Kubernetes | `DB_DRIVER=postgres`, `DATABASE_URL` |

Email is optional. With no provider configured the API still starts, logs a warning, and
the test-email action reports the missing variables instead of failing the request.

### Billing setup

1. Create two recurring prices in Stripe: $30 per month and $300 per year. Both belong
   to the same product.
2. Put their `price_...` IDs in `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY`, and add
   `STRIPE_SECRET_KEY`.
3. Add a webhook pointing at `https://<api-host>/api/billing/webhook` for
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` and
   `invoice.payment_failed`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
4. Set `PUBLIC_WEB_ORIGIN` so Stripe returns the browser to the right app.

Settings → Subscription shows the plans and the subscription state. When the four Stripe
values are absent the API and the app still run; checkout stays disabled and the screen
explains that billing is not configured. Stripe is the source of truth: the license
changes only after a signed webhook, never from the browser.

## Under the hood

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite 7, Zustand, React Router |
| Admin frontend | React 19, Vite 7, no component framework |
| Backend | Node.js 22+, Express 5, modular monolith with `domain` / `application` / `infrastructure` / `http` layers |
| Hosts | Express (VPS), AWS Lambda, Cloudflare Workers |
| Storage | Amazon DynamoDB or PostgreSQL behind one document-command interface |
| AI | Modal: YOLO11-seg plus a ResNet18 status classifier |
| Tests | Jest + Supertest (backend), Vitest + jsdom (frontends), `pg-mem` for PostgreSQL |
| License | Apache 2.0 |

Every route is declared once in `apps/backend/src/routes/definitions.js` and served by
both hosts. The composition root in `apps/backend/src/container.js` wires the modules;
[docs/backend-architecture.md](./docs/backend-architecture.md) documents the dependency
rules and the error model.

## Compatibility

| Component | Supported |
| --- | --- |
| Node.js | 22 LTS and newer (CI runs 22) |
| PostgreSQL | 14 and newer |
| Browsers | Current Chrome, Edge, Firefox and Safari |
| Self-hosting | Docker Compose, VPS with Nginx + PM2, Kubernetes |
| Serverless | AWS Lambda and Cloudflare Workers (DynamoDB only; PostgreSQL needs a long-running process) |

PostgreSQL is refused at startup on Lambda and the Worker so a per-invocation pool cannot
exhaust the database. See [docs/postgres-setup.md](./docs/postgres-setup.md).

## Getting started (production)

### Docker Compose

You need Docker with Compose v2 and Git.

```bash
git clone https://github.com/AdrianTuci1/dental-chart.git
cd dental-chart
cp .env.docker.example .env
```

Edit `.env` and set at least:

```bash
POSTGRES_PASSWORD=...
JWT_SECRET=...              # openssl rand -hex 32
REFRESH_TOKEN_SECRET=...    # openssl rand -hex 32
PLATFORM_ADMIN_EMAILS=you@example.com
```

Then start the stack:

```bash
docker compose up -d --build
```

| Service | URL |
| --- | --- |
| Clinic app | http://localhost:8080 |
| Admin app | http://localhost:8081 |
| API | http://localhost:3100 |
| Health check | http://localhost:3100/health |

The API creates the PostgreSQL schema on first start. Uploads and data live in the
`pixtooth-db` volume; `docker compose down -v` deletes it.

### Create the first administrator

1. Open the clinic app and register an account with the address from
   `PLATFORM_ADMIN_EMAILS`.
2. Open the admin app and sign in with the same credentials.
3. If the address in `.env` changed, restart the API: `docker compose up -d api`.

### Other production targets

| Target | Command | Guide |
| --- | --- | --- |
| VPS (Nginx + PM2) | `npm run deploy:backend` | [docs/deployment-automation.md](./docs/deployment-automation.md) |
| AWS Lambda (SAM) | `npm run deploy:lambda` | [docs/serverless-deployment.md](./docs/serverless-deployment.md) |
| Cloudflare Worker | `npm run deploy:worker` | [docs/serverless-deployment.md](./docs/serverless-deployment.md) |
| Cloudflare Pages | `npm run deploy:frontend` | [docs/deployment-automation.md](./docs/deployment-automation.md) |
| Kubernetes | `.github/workflows/deploy-k8s.yml` | [k8s/](./k8s/) |
| Admin app | `npm run build:admin`, serve `apps/admin/dist` | set `VITE_API_URL` and add the origin to `CORS_ORIGIN` |

## Getting started (development)

You need Node.js 22+ and either Docker (for the local PostgreSQL) or an AWS account with
a DynamoDB table.

```bash
npm install --prefix apps/backend
npm install --prefix apps/frontend
npm install --prefix apps/admin

cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Start a local database and point the API at it:

```bash
docker compose up -d db
```

In `apps/backend/.env`:

```bash
PORT=3100
DB_DRIVER=postgres
DATABASE_URL=postgres://pixtooth:pixtooth@localhost:5432/pixtooth
JWT_SECRET=dev-jwt-secret
REFRESH_TOKEN_SECRET=dev-refresh-secret
PLATFORM_ADMIN_EMAILS=you@example.com
```

Then run the three processes in separate terminals:

```bash
npm run dev --prefix apps/backend   # API on :3100
npm run dev                         # clinic app on :5173
npm run dev:admin                   # admin app on :5174
```

Open http://localhost:5173, register the administrator address, then open
http://localhost:5174.

To try the interface without a backend, `npm run dev:demo` runs the clinic app against
in-browser mock data.

### Tests and checks

```bash
npm run ci               # frontend tests, builds, backend tests, license check
npm run test:frontend
npm run test:admin
npm run test:backend
npm run check:licenses
```

## The admin app

`apps/admin` is a standalone static application. It has no shared components with the
clinic app, so it can be hosted on a different domain and locked down separately.

- **Who gets in:** accounts whose e-mail appears in `PLATFORM_ADMIN_EMAILS`. The API checks
  the list on every admin request and also refuses disabled administrators.
- **What it does:** lists accounts with name, e-mail, status, plan and creation date;
  searches and filters; disables an account and revokes its sessions; re-enables it;
  deletes an account together with its patients and clinic memberships.
- **What it refuses:** disabling or deleting the account currently signed in, and deleting
  a clinic owner while other active members remain (transfer ownership first).
- **Session timing:** disabling revokes every refresh token immediately. An access token
  already in flight remains valid until it expires (15 minutes by default), and `/auth/me`
  rejects it on the next request.
- **Indexing:** the admin page carries `noindex, nofollow` and the container sends
  `X-Robots-Tag`.

Configuration:

```bash
# API
PLATFORM_ADMIN_EMAILS=admin@example.com,ops@example.com
CORS_ORIGIN=https://admin.example.com

# Admin build
VITE_API_URL=https://api.example.com
```

## AI analysis

`apps/backend/src/modules/ai` calls a Modal endpoint that segments every tooth (YOLO11-seg,
FDI/ISO 3950 classes) and classifies each masked crop (ResNet18: sound, filling, root
canal, crown, caries, residual root, root canal + crown). When the endpoint is disabled
or unreachable, the API serves `/static/detections.json` and a sample image.

| Step | Command |
| --- | --- |
| Prepare the dataset | `modal run apps/ml/models/data_preparation.py` |
| Train segmentation | `modal run apps/ml/models/train.py` |
| Train the status classifier | `modal run apps/ml/models/train_status.py` |
| Resume classifier training | `modal run apps/ml/models/train_status.py --resume true` |
| Deploy the inference endpoint | `modal deploy apps/ml/models/inference.py` |

## API

The OpenAPI contract lives in
[apps/backend/docs/openapi.yaml](./apps/backend/docs/openapi.yaml) and is served at
`/docs`. Main groups:

- `/api/auth` — register, login, Google, refresh, logout, password recovery.
- `/api/medics`, `/api/clinics` — profile, API keys, workspaces, members, invitations.
- `/api/patients` — records, chart, history and treatment plans.
- `/api/ai` — X-ray analysis and fallback assets.
- `/api/config` — safe runtime configuration and test email.
- `/api/admin` — platform account administration, restricted to `PLATFORM_ADMIN_EMAILS`.
- `/api/external` — API-key authenticated patient upsert and delete.

## Project structure

```
├── apps/
│   ├── backend/   API modular monolith — see docs/backend-architecture.md
│   │   ├── app.js Express entry (local and VPS)
│   │   ├── lambda.js AWS Lambda host
│   │   └── src/   container.js, modules/, shared/, http/, routes/
│   ├── frontend/  Clinic app: pages, components, adapters, Zustand store
│   ├── admin/     Standalone account administration app
│   └── ml/        Modal training and inference pipeline
├── worker/        Cloudflare Worker entry point and Wrangler config
├── deploy/        SAM template, VPS release assets and generated artifacts
├── scripts/       build, deploy, license and documentation automation
├── k8s/           Kubernetes manifests
├── docs/          architecture, deployment, PostgreSQL and compliance guides
└── docker-compose.yml
```

## Documentation

| Document | Contents |
| --- | --- |
| [docs/backend-architecture.md](./docs/backend-architecture.md) | backend modules, layers, composition root, error model |
| [docs/architecture-map.md](./docs/architecture-map.md) | navigable mindmap of the frontend and backend |
| [docs/serverless-deployment.md](./docs/serverless-deployment.md) | Lambda and Worker deployment, assets, secrets |
| [docs/deployment-automation.md](./docs/deployment-automation.md) | CI, VPS release flow, Cloudflare Pages |
| [docs/postgres-setup.md](./docs/postgres-setup.md) | running the API on PostgreSQL instead of DynamoDB |
| [docs/vps-setup.md](./docs/vps-setup.md) | step-by-step VPS setup |
| [docs/compliance.md](./docs/compliance.md) | license, third-party notices, distribution and data-protection checklist |
| [docs/compliance/README.md](./docs/compliance/README.md) | security, privacy and AI governance documents, risk register and ISO 27001 gap analysis |
| [SECURITY.md](./SECURITY.md) | reporting a vulnerability and supported versions |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | development setup, DCO sign-off and pull requests |
| [apps/ml/README.md](./apps/ml/README.md) | training pipeline, dataset and Modal commands |
| [apps/backend/docs/openapi.yaml](./apps/backend/docs/openapi.yaml) | API contract |

## Learn and connect

- Start with the [architecture map](./docs/architecture-map.md) when you want the full
  picture of how the frontend and backend fit together.
- Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request; commits carry a
  Developer Certificate of Origin sign-off.
- Report bugs and feature requests in
  [GitHub Issues](https://github.com/AdrianTuci1/dental-chart/issues).
- Report security issues privately through [SECURITY.md](./SECURITY.md), never in a public
  issue.

## License

Pixtooth is licensed under the Apache License 2.0. See [LICENSE](./LICENSE) and
[NOTICE](./NOTICE). Third-party licenses, the distribution checklist and the
data-protection notes are in [docs/compliance.md](./docs/compliance.md).

---

**Version**: 1.0.0-beta
**Last updated**: October 2026
