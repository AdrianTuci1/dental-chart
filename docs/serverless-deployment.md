# Serverless deployment

Two deploy targets, each one artifact. Pick one:

|                     | Lambda                                                                  | Cloudflare Worker                                          |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| Script              | `npm run deploy:lambda`                                                 | `npm run deploy:worker`                                    |
| Template / config   | `deploy/lambda/template.yaml` (SAM)                                     | `worker/wrangler.toml`                                     |
| Artifact            | `deploy/lambda/build/` — `dist/` next to `server/`                       | `dist/` uploads to the assets binding; the API is bundled   |
| Frontend + API on   | one hostname, API under `/api`                                          | one hostname, API under `/api`                             |
| Secrets live in     | Lambda environment variables                                            | Worker secrets                                             |
| Entry point         | `server/lambda.js` via `serverless-http`                                | `worker/index.js` via `server/src/http/workerApp.js`       |

Both run the same controllers, services and repositories, and both read the same route
table in `server/src/routes/definitions.js`. Only the request and response plumbing
differs, which is why `server/src/http/workerApp.js` exists.

Neither one ships the API to the browser. The assets binding and `express.static` both
expose exactly what the build put in `dist/`; the code, the credentials and the signing
keys stay on the server side.

## The asset split

`server/src/http/staticPolicy.js` is the single place that decides the caching header for a
response path. It covers the API too, so "the build is cacheable and the API is not" lives
in one file instead of being spread across middleware:

| Path                             | Origin                          | `Cache-Control`                          |
| -------------------------------- | ------------------------------- | ---------------------------------------- |
| `/assets/*`                      | Vite output, content hashed     | `public, max-age=31536000, immutable`     |
| `/static/*`                      | `public/static/`, hand managed  | `public, max-age=3600, must-revalidate`   |
| `/`, `/patients/123`, `/docs`    | the SPA shell                   | `no-cache`                                |
| `/api/*`, `/health`              | the API                         | `no-store`                                |

`src/utils/assetPaths.js` is the frontend counterpart: `staticPath('teeth/11.png')`
returns `/static/teeth/11.png`, so nothing in `src/` writes a static URL by hand and the
prefix is never confused with the hashed one.

There is one runtime asset root, `dist/static`:

- the browser fetches it as `/static/...`
- `server/src/services/nodeAssetProvider.js` reads it from disk
- `server/src/http/workerAssets.js` reads it through the assets binding

`public/static/` is the only source in the repository. `server/public/` used to hold a
second copy of `chart2.png` and `detections.json`; the Modal pipeline writes
`public/static/detections.json`, so that copy silently went stale and the API answered
with a frozen result set. It is gone, and both the AI sample images and the fallback
detections now load through the asset provider like everything else.

## Option A: AWS Lambda

The frontend and the API travel in one package, so there is no second deploy and no
origin to keep in sync.

### Prerequisites

- AWS CLI credentials with permission to create Lambda, API Gateway, IAM and log groups
- the AWS SAM CLI (`brew install aws-sam-cli`)
- an S3 bucket in the same region; SAM uploads the ~26 MB artifact through it
- an ACM certificate for the API hostname, issued **in the same region**, validated with
  the CNAME records Cloudflare shows after you add the domain

### Configure

```bash
cp .env.deploy.example .env.deploy
$EDITOR .env.deploy
```

Fill in the AWS block. Then create the signing keys once:

```bash
npm run deploy:lambda -- --generate-secrets
```

That writes `JWT_SECRET` and `REFRESH_TOKEN_SECRET` into `.env.deploy`. Later deploys
reuse them. Keep it that way: fresh keys on every deploy end every open session.

### Deploy

```bash
npm run deploy:lambda                     # build, review the changeset, deploy
npm run deploy:lambda -- --yes            # skip the changeset prompt
npm run deploy:lambda -- --dry-run        # build and sam validate, ship nothing
npm run deploy:lambda -- --no-build       # reuse deploy/lambda/build/
```

`sam deploy` is interactive by default: it shows the changeset and asks for confirmation
before touching anything. The script prints the stack outputs at the end, including
`CustomDomainTarget`.

### Point the domain at it

The record goes in the Cloudflare zone that owns the hostname, as a CNAME with
`CustomDomainTarget` as the value. Validate the certificate first, or the CNAME resolves
to a domain with no usable certificate.

Both colours of cloud work, and the choice is the whole caching decision:

- **Proxied** (orange) — Cloudflare terminates TLS, and the cache rules above decide what
  is kept. The API stays uncacheable because the app sends `no-store`.
- **DNS only** (grey) — Cloudflare only answers the lookup. Nothing is cached at the edge
  at all, and the cache rules do not apply.

Pick proxied if the frontend should be served from the edge. Pick DNS only if you would
rather have no cache to reason about; the app's headers still travel to the browser.

### CORS

On this target the frontend is normally still on Cloudflare Pages while the API moves, so
the browser makes cross-origin calls and `CORS_ORIGIN` in `.env.deploy` has to list the
app's origin. Deploying the frontend from the same Lambda package instead, as
`template.yaml` already does, makes the API same-origin and takes CORS out of the picture.

## Option B: Cloudflare Worker

### Prerequisites

- `npx wrangler login`, or `CLOUDFLARE_API_TOKEN` plus `CLOUDFLARE_ACCOUNT_ID` in the shell
- the zone that owns the hostname already added to Cloudflare

### Deploy

```bash
cp .env.deploy.example .env.deploy
$EDITOR .env.deploy                       # the shared block plus WORKER_DOMAIN
npm run deploy:worker -- --sync-secrets   # push .env.deploy values as Worker secrets
npm run deploy:worker                     # build and upload
npm run deploy:worker -- --dry-run        # bundle to deploy/worker/build/, upload nothing
```

Without `--sync-secrets` the script only reports which required secrets are missing and
prints the `wrangler secret put` command for each. With it, every value it finds in
`.env.deploy` is uploaded, so the file stays the one place that describes the deployment.

`WORKER_DOMAIN` attaches the public hostname. The Worker serves the frontend and the API
on it, so this is the domain the app answers on — the one the Pages project uses today.
Leave it empty to deploy to `<worker>.<subdomain>.workers.dev` and attach the domain from
the dashboard afterwards.

The build is made with `VITE_API_URL=self`, so the frontend calls whatever origin serves
it. That means the Worker has to serve the app: keeping the Pages project on the app's
hostname and putting only the API on a Worker hostname would leave the frontend calling
its own origin. Move the hostname to the Worker, and the Pages project can go.

Because the frontend and the API share an origin here, there is no CORS on this path and
`CORS_ORIGIN` is only relevant if something else calls the API.

`worker/wrangler.toml` sets `run_worker_first = true`, so every request reaches the Worker
before the assets binding. That is what lets the cache headers come from
`server/src/http/staticPolicy.js` on this host too, instead of the assets binding
answering with its own defaults and the two targets disagreeing.

### The two build variables

`scripts/deploy-worker.mjs` sets both before calling wrangler, and `npm run dev:worker`
sets them for local development. A hand-written `wrangler` command needs them too:

```bash
WRANGLER_BUILD_PLATFORM=node WRANGLER_BUILD_CONDITIONS=workerd,worker,node \
  npx wrangler deploy -c worker/wrangler.toml
```

Wrangler bundles dependencies with the `browser` condition by default. Six AWS SDK
subpaths — `@aws-sdk/core/client`, `@aws-sdk/core/httpAuthSchemes`,
`@smithy/core/config`, `@smithy/core/checksum`, `@smithy/core/retry` and
`@smithy/core/serde` — answer that condition with a build that replaces Node-only helpers
with `Symbol.for("node-only")`, while the surrounding SDK calls those helpers anyway. The
client then throws `emitWarningIfUnsupportedVersion is not a function` or
`loadConfig is not a function` the first time it is constructed, and every route that
touches DynamoDB answers 500.

Both variables are needed, and neither is enough alone: `WRANGLER_BUILD_PLATFORM=node`
drops the implicit `browser` condition, and `WRANGLER_BUILD_CONDITIONS` keeps wrangler
from adding it back through its own default list. Dropping `browser` sends those subpaths
through `import`/`require`, which are the Node builds this runtime supports.

## Cloudflare cache: the build, never the API

The zone is on Cloudflare and the proxy is on for the app's hostname on both targets, so
Cloudflare's cache sits in front of the frontend and the API alike. Only the built
frontend may be stored there.

That split is enforced in code, not left to the rules. `server/src/http/staticPolicy.js`
is the single source, and both hosts apply it:

| Path                        | Header the app sends                      | Kept at the edge |
| --------------------------- | ----------------------------------------- | ---------------- |
| `/assets/*` (hashed build)   | `public, max-age=31536000, immutable`      | yes              |
| `/static/*`                 | `public, max-age=3600, must-revalidate`    | yes              |
| `/`, `/patients/123`, `/docs` | `no-cache`                               | revalidated only |
| `/api/*`, `/health`          | `no-store`                                | never            |

`no-store` on the API is the part that matters. Cloudflare caches by file extension by
default, with no rule of yours involved, which is already enough to cache
`/api/ai/assets/chart2.png` because of the `.png`. A cache rule written too broadly would
be worse. The header holds whatever the rules say, and it also covers any other proxy that
ends up in the path later.

### Rules to add

**Caching → Cache Rules**, on the zone that owns the hostname. Three rules, in this order,
because the first match wins:

1. **Bypass cache** where `URI Path` starts with `/api/`
2. **Eligible for cache** where `URI Path` matches `/assets/*`
3. **Eligible for cache** where `URI Path` matches `/static/*`

For rules 2 and 3, set the edge TTL to follow the response's `Cache-Control` header, so the
TTL has one source and the rule only has to permit the cache.

Rule 1 is the second lock, not the first. The app already answers the API with `no-store`,
but a cache rule that sets an explicit TTL overrides that header — so a broad rule added
later would be able to cache patient data on its own. Rule 1 sits ahead of everything else
and matches only `/api/`, which makes that impossible without having to notice.

Do not let any other rule match the whole hostname, and do not use "Cache Everything".

Everything else needs no rule. HTML and extensionless paths are not cached by default, and
the app sends `no-cache` for them anyway.

If you would rather apply the rule set from a file than by hand, both the Cloudflare API
and the Terraform provider express these three conditions directly.

## Secrets

**Worker.** `wrangler secret put NAME -c worker/wrangler.toml`, or `--sync-secrets` from
`.env.deploy`. Secrets are encrypted at rest and not readable from the dashboard after
upload.

**Lambda.** They arrive as function environment variables through `--parameter-overrides`,
which means two exposures worth knowing about: the values are visible in the process list
of whoever runs the deploy, and anyone with `lambda:GetFunctionConfiguration` on the
account can read them back out of the function.

Both go away by moving the two signing keys to SSM Parameter Store as `SecureString` and
resolving them in `template.yaml` with a dynamic reference:

```yaml
JWT_SECRET: '{{resolve:ssm-secure:/pixtooth/jwt-secret:1}}'
```

The stack then stores a reference rather than a value. That is the change to make when the
account has more than one administrator.

## Rollback

```bash
# Worker: list versions, then roll the deployment back
npx wrangler deployments list -c worker/wrangler.toml
npx wrangler rollback <version-id> -c worker/wrangler.toml

# Lambda: redeploy the previous revision, or roll the stack back
git checkout <previous-commit> && npm run deploy:lambda -- --yes
aws cloudformation rollback-stack --stack-name pixtooth
```

## Known limits

- **Rate limiting on the Worker** counts per isolate, because the in-memory buckets are
  not shared between them. Lambda behaves the same way per warm instance. Exact limits
  need a Durable Object or a shared store; the Worker path is where that would go.
- **Request size.** An API Gateway HTTP API accepts 10 MB per request. A Lambda Function
  URL stops at 6 MB, which is one reason `template.yaml` uses an HTTP API rather than a
  function URL. A Worker accepts up to 100 MB. X-rays beyond the limit must be compressed
  before upload.
- **`AWS_REGION` must match the region the DynamoDB table lives in**, in `.env.deploy`
  and again in the Lambda stack or the Worker secrets.
- **Cold starts.** A Lambda that has been idle pays a few hundred milliseconds on the
  first request. A Worker isolate is usually already warm.
- **`server/public/` no longer exists.** The API serves its assets from `dist/static`, so
  a host without a built `dist/` answers `/api/ai/assets/*` with 404 and the AI fallback
  with 503 instead of serving from a second copy. Both serverless targets always build
  `dist/`.

## Troubleshooting

| Symptom                                                                     | Cause                                                                                   |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `emitWarningIfUnsupportedVersion is not a function`, `loadConfig is not a function` | Bundled with the `browser` condition. Set both build variables above.                     |
| A stale API answer is served to another user                                   | A cache rule matches the whole hostname or an explicit TTL overrides the app's `no-store`. Remove the rule; the headers already do the right thing. |
| `/docs` and `/docs/openapi.yaml` answer 404 on the Worker                     | `dist/api-docs/` is missing. Run `npm run build` or re-run the deploy without `--no-build`. |
| Every data route answers 500 on the Worker                                    | Worker secrets are missing or the AWS keys are expired. Run `npm run deploy:worker -- --sync-secrets`. |
| `The security token included in the request is invalid`                       | The AWS credentials are present but expired or wrong.                                     |
| Static files work, every data route fails                                     | DynamoDB is unreachable from that runtime: wrong region, missing table, or an IAM policy that does not cover the table. |
