# Security policy

## Supported versions

Security fixes land on `main` and in the next deployment. Older commits and
self-hosted forks are supported on a best-effort basis; update to the latest
release before reporting an issue that may already be fixed.

## Reporting a vulnerability

Use GitHub private vulnerability reporting:

https://github.com/AdrianTuci1/dental-chart/security/advisories/new

Do not open a public issue for a suspected vulnerability. Include the affected
route or module, reproduction steps, the impact you expect, and any logs or
requests that help reproduce it. Remove patient data, tokens and credentials
from the report.

The maintainer acknowledges reports within five business days, confirms whether
the issue is in scope, and coordinates a fix and disclosure date with the
reporter.

## Scope

In scope:

- authentication, session handling and API-key access in `apps/backend`
- authorization between clinics and medics
- patient data exposure through the API or the frontend
- injection, path traversal and unsafe file handling
- deployment configuration in `deploy/`, `k8s/` and `worker/`
- dependency vulnerabilities with a plausible exploit path in this application

Out of scope:

- missing hardening headers on hosts that do not run this code
- denial of service through traffic volume alone
- social engineering
- vulnerabilities in third-party packages without a reachable path here;
  report those upstream as well

## Handling secrets

Never commit `.env` files, deployment credentials, patient data or API keys.
The repository ignores local environment files, and `/api/config` reports only
whether a setting is present, never its value.
