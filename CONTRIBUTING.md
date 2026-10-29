# Contributing

Pixtooth is licensed under the Apache License 2.0. By submitting a contribution
you agree that it is your work or that you have the right to submit it, and
that it is licensed under the same terms (inbound matching outbound).

## Developer Certificate of Origin

Sign off every commit to certify the contribution:

```bash
git commit -s -m "feat: describe the change"
```

The sign-off adds a `Signed-off-by: Your Name <you@example.com>` trailer. Do not
add a sign-off for code you did not write or are not allowed to contribute.

## Set up

```bash
npm install
npm install --prefix apps/backend
npm install --prefix apps/frontend
```

Copy `apps/backend/.env.example` to `apps/backend/.env` for local development.
The API runs without an email provider and without AWS credentials in demo
mode; see `apps/backend/.env.example` for the available switches.

## Before opening a pull request

```bash
npm run ci              # frontend tests, frontend build, backend tests
npm run check:licenses  # production dependencies stay under permissive licenses
```

For a UI change, exercise the affected flow in a browser and check the routes
that read the same state. For a backend change, add or update a test in
`apps/backend/tests`.

## Pull requests

- Keep the change focused; separate refactors from behavior changes.
- Describe what changed, why, how it was tested, and any migration or deployment
  step.
- Update the OpenAPI contract in `apps/backend/docs/openapi.yaml` and the docs in
  `docs/` when the API or configuration changes.
- Report security issues through [SECURITY.md](./SECURITY.md), not in a public
  pull request.

## Conventions

The backend is a modular monolith. Each bounded context keeps `domain`,
`application`, `infrastructure` and `http` layers, dependencies point inward,
and `src/container.js` is the only composition root. Read
[docs/backend-architecture.md](./docs/backend-architecture.md) before adding a
module or a cross-context dependency.
